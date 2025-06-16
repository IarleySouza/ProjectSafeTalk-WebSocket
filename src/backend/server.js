"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
class App {
    constructor() {
        this.usersOnline = {};
        this.app = (0, express_1.default)();
        this.http = http_1.default.createServer(this.app);
        this.io = new socket_io_1.Server(this.http);
        this.io = new socket_io_1.Server(this.http, {
            maxHttpBufferSize: 10e6 // 10MB
        });
        this.listenSocket();
        this.setupRoutes();
    }
    listenServer() {
        const PORT = process.env.PORT || 3000;
        this.http.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    }
    listenSocket() {
        this.io.on('connection', (socket) => {
            console.log('user connected => ', socket.id);
            // Quando um usuário entra no chat
            socket.on('userJoined', (userName) => {
                this.usersOnline[socket.id] = userName;
                this.io.emit('updateUsers', Object.values(this.usersOnline));
            });
            // Quando um usuário envia uma mensagem
            socket.on('message', (msg) => {
                console.log(`Received message from ${msg.name}: ${msg.content}`);
                socket.emit('message', Object.assign(Object.assign({}, msg), { fromUser: true }));
                socket.broadcast.emit('message', Object.assign(Object.assign({}, msg), { fromUser: false }));
            });
            // Quando um usuário está digitando
            socket.on('typing', (name) => {
                socket.broadcast.emit('typing', name);
            });
            // Quando um usuário para de digitar
            socket.on('stopTyping', () => {
                socket.broadcast.emit('stopTyping');
            });
            // Quando um usuário envia uma imagem
            socket.on('image', (data) => {
                console.log(`Imagem recebida de ${data.name}`);
                socket.emit('image', data);
                socket.broadcast.emit('image', data);
            });
            // Quando um usuário desconecta
            socket.on('disconnect', () => {
                console.log('Usuário desconectado:', socket.id);
                delete this.usersOnline[socket.id];
                this.io.emit('updateUsers', Object.values(this.usersOnline));
            });
            // WebRTC - Oferta de conexão
            socket.on("offer", (data) => {
                // Envia a oferta para todos os outros usuários (pode adaptar para direcionar a um usuário específico)
                socket.broadcast.emit("offer", data);
            });
            // WebRTC - Resposta à oferta
            socket.on("answer", (data) => {
                // Retorna a resposta para quem fez a oferta
                socket.broadcast.emit("answer", data);
            });
            // WebRTC - Troca de ICE Candidates
            socket.on("candidate", (data) => {
                // Compartilha os candidatos com todos os outros sockets
                socket.broadcast.emit("candidate", data);
            });
        });
    }
    setupRoutes() {
        this.app.use(express_1.default.static(path_1.default.resolve(__dirname, '../../frontend')));
        this.app.get('/', (req, res) => {
            res.sendFile(path_1.default.join(__dirname, "../../frontend/index.html"));
        });
    }
}
const app = new App();
app.listenServer();
