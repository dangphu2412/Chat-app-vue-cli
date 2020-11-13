<template>
  <div id="layout" class="home">
    <a-row class="header">
      <a-col :span="5">CHAT WITH FUSS</a-col>
      <a-col :span="15">
        <a-icon class="video" @click="startCallVideo" type="video-camera" />
      </a-col>
      <a-col :span="2">
        <span>{{ currentConversationInfo.username }}</span>
      </a-col>
      <a-col :span="2">
        <a-dropdown>
          <div class="friend-avatar mr-3">
            <img :src="currentConversationInfo.avatar" />
          </div>
          <a-menu slot="overlay">
            <a-menu-item>
              <a href="javascript:;">Profile</a>
            </a-menu-item>
            <a-menu-item>
              <a @click="leaveRoom">Log out</a>
            </a-menu-item>
          </a-menu>
        </a-dropdown>
      </a-col>
    </a-row>
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
            <span slot="title">
              <a-icon type="user" />
              <span>Friends</span>
            </span>
            <a-input-search
              placeholder="Search friend ..."
              enter-button="Send"
              @search="searchFriend"
              v-model="searchFriendValue"
              class="cover-search"
            />
            <a-menu-item
              v-for="user in users"
              :key="user.id"
              @click="loadConversation(user._id)"
              class="cover"
            >
              <span class="friend-avatar">
                <img :src="user.avatar" />
              </span>
              <span class="friend-name">{{ user.username }}</span>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="sub2" @titleClick="titleClick">
            <span slot="title"
              ><a-icon type="appstore" /><span>Request</span></span
            >
          </a-sub-menu>
          <a-sub-menu key="sub4">
            <span slot="title"
              ><a-icon type="setting" /><span>Conversation</span></span
            >
            <a-input-search
              placeholder="Search friend ..."
              enter-button="Send"
              size="medium"
              @search="searchConversation"
              v-model="searchConversationValue"
              class="cover-search"
            />
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
    <a-modal
      v-model="visible"
      title="Call video"
      @onOk="onOk"
      @onCancel="onCancel"
    >
      <video autoplay class="remote-video" id="remote-video"></video>
      <video autoplay class="local-video" id="local-video"></video>
    </a-modal>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
export default {
  name: "Home",
  data() {
    return {
      visible: false,
      prefixImg:
        "https://i.pinimg.com/originals/51/f6/fb/51f6fb256629fc755b8870c801092942.png",
      current: ["mail"],
      openKeys: ["friends"],
      io: io.connect("http://localhost:3000/room"),
      message: "",
      currentMessagesConversation: [],
      currentConversationInfo: {
        _id: undefined,
        avatar: "",
        username: ""
      },
      users: [],
      bindingClass: {
        author: "author",
        roomate: "roomate"
      },
      authorId: null,
      searchFriendValue: "",
      searchConversationValue: "",
      peerConnection: undefined,
      remotePeerConnection: undefined,
      peerConfig: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
    };
  },
  created() {
    this.getAuthorId();
    this.listenMessage();
    this.listenCall();
    this.listenAnswer();
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
    onOk() {
      this.visible = false;
    },
    onCancel() {
      this.visible = false;
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
    async getConnectedDevices(type) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === type);
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
    },
    setPeerConnection() {
      this.peerConnection = new RTCPeerConnection(this.peerConfig);
    },
    setRemotePeerConnection() {
      this.remotePeerConnection = new RTCPeerConnection(this.peerConfig);
    },
    setCurrentConversationInfo(currentUser_Id) {
      const info = this.users.find(info => info._id === currentUser_Id);
      this.currentConversationInfo = { ...info };
    },
    async setLocalVideoReturnStream() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      return stream;
    },
    setRemoteStream() {
      const remoteStream = new MediaStream();
      const remoteVideo = document.getElementById("remote-video");
      remoteVideo.srcObject = remoteStream;

      // this.remotePeerConnection.addEventListener("track", event => {
      //   remoteStream.addTrack(event.track, remoteStream);
      // });
    },
    async listenCall() {
      this.io.on("call-made", async data => {
        this.setRemotePeerConnection();
        this.visible = true;
        const stream = await this.setLocalVideoReturnStream();
        this.peerConnection = new RTCPeerConnection(this.configuration);
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(
          new RTCSessionDescription(answer)
        );
        await this.emitOfferToCurrentConversation();
        stream
          .getTracks()
          .forEach(track => this.peerConnection.addTrack(track, stream));
        this.io.emit("make-answer", {
          answer,
          to: data.to
        });
      });
    },
    // Setup socket answer-made to listen answer
    async listenAnswer() {
      this.io.on("answer-made", async data => {
        this.setRemoteStream();
        const remoteDesc = new RTCSessionDescription(data.answer);
        await this.remotePeerConnection.setRemoteDescription(remoteDesc);
      });
    },
    async loadConversation(currentUser_Id) {
      this.io.emit("joinRoom", currentUser_Id);
      this.setCurrentConversationInfo(currentUser_Id);
    },
    async searchFriend() {},
    async searchConversation() {},
    async emitOfferToCurrentConversation() {
      const currentUser_Id = this.currentConversationInfo._id;
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(
        new RTCSessionDescription(offer)
      );
      const peerInfo = {
        to: currentUser_Id,
        offer
      };
      this.io.emit("call-user", peerInfo);
    },
    async startCallVideo() {
      this.visible = true;
      try {
        this.setPeerConnection();
        const stream = await this.setLocalVideoReturnStream();
        await this.emitOfferToCurrentConversation();
        stream
          .getTracks()
          .forEach(track => this.peerConnection.addTrack(track, stream));
      } catch (error) {
        this.visible = false;
        alert(error);
      }
    }
  }
};
</script>

<style scoped>
#layout .ant-layout-header {
  background: #ffffff;
  color: #fff;
}
.header {
  padding-top: 10px;
}

.author {
  text-align: left;
}
.roomate {
  text-align: right;
}

.video {
  cursor: pointer;
  font-size: 16px;
}

.local-video {
  width: 200px;
  height: 200px;
}

.cover {
  width: 100%;
  height: 100%;
}

.cover-search {
  padding: 0 10px;
}

.friend-avatar {
  width: 50px;
  height: 50px;
  overflow: hidden;
}

.friend-name {
  text-align: center;
  margin-left: 20px;
}

.friend-avatar img {
  height: 100%;
  border-radius: 50%;
  cursor: pointer;
}
</style>
