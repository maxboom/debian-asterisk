# 🧪 WebRTC SIP клиент на Asterisk + JsSIP

Этот проект демонстрирует, как настроить браузерный SIP-клиент на основе WebRTC, подключённый к Asterisk через WebSocket (`ws://localhost:8088/ws`) с использованием библиотеки [JsSIP](https://jssip.net/).

---

## ⚙️ Состав проекта

- Asterisk 18+ в Docker
- JsSIP фронтенд на HTML/JS
- SIP-пользователи 6001 и 6003
- WebSocket-соединение через Asterisk HTTP сервер (`res_http_websocket.so`)

---

## 🚀 Запуск

### 1. Клонируй репозиторий

```bash
git clone git@github.com:maxboom/debian-asterisk.git
cd debian-asterisk
```

### 2. Запусти Asterisk в Docker
```bash
docker-compose up --build
```

### 3. Открой браузерный клиент
**Открой [index.html](client/index.html) в браузере.**

___

### 🔑 Учетные записи
| Пользователь | Пароль |
| ------------ | ------ |
| 6001         | 1234   |
| 6003         | 1234   |

### ❓ Возможные проблемы
- 🔴 **JsSIP "Timer B expired"** → Asterisk не принимает WebSocket.
- 🟠 **ICE: disconnected** →  проблема с настройками ICE/STUN. Возможно нужно выделить внешний адрес для asterisk.
- 🔵 **WebSocket error** → убедись, что порт 8088 открыт и res_http_websocket.so загружен.



