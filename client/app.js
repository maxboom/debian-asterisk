let socket = io('http://localhost:3000');
let ua;
let currentSession = null;
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

remoteVideo.onloadedmetadata = () => {
    console.log('✅ Remote video loaded!');
};

remoteVideo.onplay = () => {
    console.log('🎥 Remote video playing...');
};

remoteVideo.onerror = (err) => {
    console.error('🚨 Video error:', err);
};

function sipLogin() {
    // JsSIP.debug.enable('JsSIP:*');

    const configuration = {
        uri: 'sip:' + sip.value + '@172.17.0.1',
        password: pass.value,
        sockets: [new JsSIP.WebSocketInterface('ws://localhost:8088/ws')],
        session_timers: false,
        contact_uri: 'sip:' + sip.value + '@172.17.0.1'
    };

    ua = new JsSIP.UA(configuration);

    ua.on('connected', () => {
        console.log('Connected');
        socket.emit('login', sip.value);
    });

    ua.on('newRTCSession', (data) => {
        const session = data.session;
        console.log('New session:', session);

        if (session.direction === 'incoming') {
            showIncomingCallModal(session.remote_identity.uri.user, () => {
                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                    .then(stream => {
                        localVideo.srcObject = stream;

                        if (window.showVideo) window.showVideo();

                        session.answer({
                            mediaStream: stream,
                            mediaConstraints: { audio: true, video: true }
                        });

                        bindRemoteStream(session);
                        currentSession = session;
                    });
            }, () => {
                session.terminate();
            });
        }
    });

    ua.start();
}

function call(target) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
            localVideo.srcObject = stream;

            const session = ua.call('sip:' + target + '@172.17.0.1', {
                mediaStream: stream,
                mediaConstraints: { audio: true, video: true },
                rtcOfferConstraints: {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                },
                rtcConfiguration: {
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                }
            });

            if (window.showVideo) window.showVideo();

            session.connection.oniceconnectionstatechange = () => {
                console.log('ICE STATE:', session.connection.iceConnectionState);
            };

            bindRemoteStream(session);
            currentSession = session;
        });
}

function bindRemoteStream(session) {
    session.connection.addEventListener('track', (event) => {
        if (event.track.kind === 'video') {
            console.log('📡 Remote track received', event);
            remoteVideo.srcObject = event.streams[0];

            remoteVideo.onloadedmetadata = () => console.log('✅ Metadata loaded');
            remoteVideo.onplay = () => console.log('▶️ Playing remote video');
            remoteVideo.onerror = (err) => console.error('🚨 remoteVideo error:', err);

            remoteVideo.play().catch(e => console.error('🔴 .play() failed:', e));

            session.on('ended', () => {
                console.log('📴 Call ended by remote');
                resetVideoUI();
                currentSession = null;
            });

            session.on('failed', (e) => {
                console.log('❌ Call failed', e);
                resetVideoUI();
                currentSession = null;
            });

            session.on('bye', () => {
                console.log('👋 Remote sent BYE');
                resetVideoUI();
                currentSession = null;
            });
        }
    });
}

function showIncomingCallModal(caller, onAccept, onReject) {
    const modal = document.getElementById('incoming-call-modal');
    const text = document.getElementById('incoming-call-text');
    const acceptBtn = document.getElementById('accept-call');
    const rejectBtn = document.getElementById('reject-call');

    text.textContent = `Входящий вызов от ${caller}`;
    modal.style.display = 'flex';

    function cleanup() {
        modal.style.display = 'none';
        acceptBtn.removeEventListener('click', handleAccept);
        rejectBtn.removeEventListener('click', handleReject);
    }

    function handleAccept() {
        cleanup();
        onAccept();
    }

    function handleReject() {
        cleanup();
        onReject();
    }

    acceptBtn.addEventListener('click', handleAccept);
    rejectBtn.addEventListener('click', handleReject);
}


function resetVideoUI() {
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    const videoContainer = document.getElementById('videoContainer');
    videoContainer.style.display = 'none';
}


document.getElementById('endCall').onclick = () => {
    if (currentSession) {
        currentSession.terminate();

        resetVideoUI();
    }
};

socket.on('update-disconnected', (disconnectedUserId) => {
    if (currentSession && currentSession.remote_identity.uri.user === disconnectedUserId) {
        console.log(`🚫 User ${disconnectedUserId} disconnected. Ending call.`);
        currentSession.terminate();
        resetVideoUI();
        currentSession = null;
    }
});

socket.on('update-users', userList => {
    const container = document.getElementById('user-list');
    container.innerHTML = '';
    userList.forEach(user => {
        const btn = document.createElement('button');
        btn.textContent = user;
        btn.onclick = () => call(user);
        container.appendChild(btn);
    });
});
