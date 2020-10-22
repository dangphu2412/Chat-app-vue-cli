<template>
  <div class="home">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      title="Super chat"
    >
      <template slot="extra">
        <a-dropdown>
          <a-menu slot="overlay" @click="handleMenuClick">
            <a-menu-item key="1"> <a-icon type="user" />Profile </a-menu-item>
            <a-menu-item @click="leaveRoom" key="3">
              <a-icon type="user" />Log out
            </a-menu-item>
          </a-menu>
          <a-button style="margin-left: 8px">
            Button <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </template>
    </a-page-header>

    <a-row>
      <a-col :span="5">
        <a-menu
          style="width: 100%"
          :default-selected-keys="['1']"
          :open-keys.sync="openKeys"
          :wrapper-col="{ span: 6, offset: 6 }"
          mode="inline"
          @click="handleClick"
        >
          <a-sub-menu key="friends" @titleClick="loadConversation">
            <span slot="title"><a-icon type="user" /><span>Friends</span></span>
            <a-menu-item-group key="g1">
              <a-menu-item
                v-for="user in users"
                :key="user.id"
                @click="loadConversation(user._id)"
                class="cover"
              >
                {{ user.username }}
              </a-menu-item>
            </a-menu-item-group>
          </a-sub-menu>
          <a-sub-menu key="sub2" @titleClick="titleClick">
            <span slot="title"
              ><a-icon type="appstore" /><span>Navigation Two</span></span
            >
            <!-- <a-menu-item key="5">
              Option 5
            </a-menu-item>
            <a-menu-item key="6">
              Option 6
            </a-menu-item> -->
          </a-sub-menu>
          <a-sub-menu key="sub4">
            <span slot="title"
              ><a-icon type="setting" /><span>Navigation Three</span></span
            >
            <a-menu-item key="9">
              Option 9
            </a-menu-item>
            <a-menu-item key="10">
              Option 10
            </a-menu-item>
            <a-menu-item key="11">
              Option 11
            </a-menu-item>
            <a-menu-item key="12">
              Option 12
            </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-col>

      <a-col :span="19" class="main">
        <div class="chat-messages">
          <div v-for="context in currentMessagesConversation" :key="context.id">
            <div :class="getAuthorContext(context)">
              {{ context.msg }}
            </div>
          </div>
        </div>
        <a-input-search
          placeholder="Type here ..."
          enter-button="Send"
          size="large"
          @search="sendMessage"
          v-model="message"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
export default {
  name: "Home",
  data() {
    return {
      current: ["mail"],
      openKeys: ["friends"],
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
  watch: {
    openKeys(val) {
      console.log("openKeys", val);
    }
  },
  methods: {
    handleClick(e) {
      console.log("click", e);
    },
    titleClick(e) {
      console.log("titleClick", e);
    },
    handleMenuClick() {},
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
    sendMessage() {
      console.log("here");
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
      this.io.emit("joinRoom", currentUserId);
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
