FROM debian:stable

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    curl \
    libncurses5-dev \
    libssl-dev \
    libxml2-dev \
    libjansson-dev \
    libedit-dev \
    pkg-config \
    uuid-dev \
    libsrtp2-dev \
    libspandsp-dev \
    libopus-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src

ENV ASTERISK_VERSION="asterisk-18.26.2"

RUN wget http://downloads.asterisk.org/pub/telephony/asterisk/${ASTERISK_VERSION}.tar.gz && \
    tar xzf ${ASTERISK_VERSION}.tar.gz && \
    rm ${ASTERISK_VERSION}.tar.gz

WORKDIR /usr/src/${ASTERISK_VERSION}

RUN ./configure --with-jansson-bundled && \
    make menuselect.makeopts && \
    menuselect/menuselect --enable codec_opus menuselect.makeopts && \
    make && make install \
    && make samples && make config

EXPOSE 5060 5060/udp 5061 8088 8089 10000-20000/udp

CMD ["asterisk", "-f", "-vvv"]
