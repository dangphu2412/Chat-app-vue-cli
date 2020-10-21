<template>
  <div class="home">
    <div class="chat-container">
      <header class="chat-header">
        <h1><i class="fas fa-smile"></i> ChatCord</h1>
        <button @click="leaveRoom" class="btn">Leave Room</button>
      </header>
      <main class="chat-main">
        <div class="chat-sidebar">
          <h3><i class="fas fa-comments"></i> Room Name:</h3>
          <h2 id="room-name"></h2>
          <h3><i class="fas fa-users"></i> Users</h3>
          <ul id="users">
            <li
              v-for="user in users"
              :key="user.id"
              @click="loadConversation(user.id)"
              class="cover"
            >
              <img class="cover-thumbnail" :src="user.avatar" />
              <div>{{ user.username }}</div>
              <div>{{ user.latestMessage }}</div>
            </li>
          </ul>
        </div>
        <div class="chat-messages">
          <div v-for="context in currentMessagesConversation" :key="context.id">
            <div :class="getAuthorContext(context)">
              {{ context.msg }}
            </div>
          </div>
        </div>
      </main>
      <div class="chat-form-container">
        <form id="chat-form" @submit="sendMessage">
          <input
            id="msg"
            type="text"
            placeholder="Enter Message"
            required
            autocomplete="off"
            v-model="message"
          />
          <button class="btn"><i class="fas fa-paper-plane"></i> Send</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
export default {
  name: "Home",
  data() {
    return {
      io: io.connect("http://localhost:3000/room"),
      message: "",
      currentMessagesConversation: [],
      users: [],
      bindingClass: {
        author: "author",
        roomate: "roomate"
      },
      authorId: null
    };
  },
  created() {
    this.getAuthorId();
    this.listenMessage();
  },
  mounted() {
    this.getFriends();
  },
  methods: {
    leaveRoom() {
      localStorage.clear("access_token");
      localStorage.clear("info");
      window.location.href = "/login";
    },
    listenMessage() {
      this.io.on("receiveMess", msg => {
        console.log(this.io);
        console.log(msg);
        const messageCtx = {
          id: this.currentMessagesConversation.length + 1,
          msg: msg,
          isAuthor: false
        };
        this.currentMessagesConversation.push(messageCtx);
      });
    },
    sendMessage(event) {
      event.preventDefault();
      this.io.emit("sendMess", this.message);
      this.currentMessagesConversation = [
        ...this.currentMessagesConversation,
        {
          id: this.currentMessagesConversation.length,
          msg: this.message,
          isAuthor: true
        }
      ];
      this.message = "";
    },
    getAuthorId() {
      const info = localStorage.getItem("info");
      this.authorId = info.userId;
    },
    getAuthorContext(context) {
      return context.isAuthor
        ? this.bindingClass.author
        : this.bindingClass.roomate;
    },
    async loadConversation(currentUserId) {
      const { _id } = this.users[currentUserId];
      this.io.emit("joinRoom", _id);
    },
    async getFriends() {
      const response = await axios.get(
        "http://localhost:3000/api/users/v1?offset=0&limit=10"
      );
      const {
        data: { data: friends }
      } = response;
      this.users = friends.map((friend, id) => {
        return {
          id,
          ...friend
        };
      });
    }
  }
};
</script>

<style scoped>
.author {
  text-align: left;
}
.roomate {
  text-align: right;
}

.cover {
  width: 100%;
  height: 100%;
}

.cover-thumbnail {
  width: 100%;
}
</style>
