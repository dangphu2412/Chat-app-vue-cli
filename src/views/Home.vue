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
            >
              <img class="thumbnail" :src="user.avatar" />
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
// import axios from "axios";
// import io from "socket.io-client";
export default {
  name: "Home",
  data() {
    return {
      // io: io.connect("http://localhost:3000/room"),
      message: "",
      currentMessagesConversation: [
        {
          id: 1,
          msg: "hello",
          isAuthor: true
        },
        {
          id: 2,
          msg: "sadsa",
          isAuthor: false
        }
      ],
      users: [
        {
          id: 1,
          username: "phupro",
          avatar:
            "https://i.pinimg.com/originals/51/f6/fb/51f6fb256629fc755b8870c801092942.png",
          latestMessage: "Yo what s up"
        },
        {
          id: 2,
          username: "phupro",
          avatar:
            "https://i.pinimg.com/originals/51/f6/fb/51f6fb256629fc755b8870c801092942.png",
          latestMessage: "Yo what s up"
        },
        {
          id: 3,
          username: "phupro",
          avatar:
            "https://i.pinimg.com/originals/51/f6/fb/51f6fb256629fc755b8870c801092942.png",
          latestMessage: "Yo what s up"
        }
      ],
      bindingClass: {
        author: "author",
        roomate: "roomate"
      }
    };
  },
  // created() {

  // },
  methods: {
    leaveRoom() {
      alert("> Leaving");
      this.$router.push({ path: "login" });
    },
    sendMessage(event) {
      event.preventDefault();
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
    getAuthorContext(context) {
      return context.isAuthor
        ? this.bindingClass.author
        : this.bindingClass.roomate;
    },
    async loadConversation(currentUserId) {
      alert(currentUserId);
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
.thumbnail {
  overflow: hidden;
  width: 100%;
  height: 100px;
}
</style>
