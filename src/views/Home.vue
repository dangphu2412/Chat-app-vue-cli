<template>
  <div id="layout" class="home">
    <a-row class="header">
      <a-col :span="5">CHAT WITH FUSS</a-col>
      <a-col :span="15">
        <a-icon class="video" @click="startCallVideo" type="video-camera" />
      </a-col>

      <!-- Current username of conversation -->
      <a-col :span="2">
        <span>{{ currentConversationInfo.username }}</span>
      </a-col>

      <a-col :span="2">
        <a-dropdown>
          <div class="friend-avatar mr-3">
            <!-- Get avatar of conversation -->
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

            <!-- Load conversation by _id of user -->
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
            <a-menu-item key="9"> Option 9 </a-menu-item>
            <a-menu-item key="10"> Option 10 </a-menu-item>
            <a-menu-item key="11"> Option 11 </a-menu-item>
            <a-menu-item key="12"> Option 12 </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-col>

      <a-col :span="19" class="main">
        <!-- Load all messages -->
        <div class="chat-messages">
          <div v-for="context in currentMessagesConversation" :key="context.id">
            <div :class="getAuthorContext(context)">
              {{ context.msg }}
            </div>
          </div>
        </div>
        <!-- Send message buttonl-->
        <a-input-search
          placeholder="Type here ..."
          enter-button="Send"
          size="large"
          @search="sendMessage"
          v-model="message"
        />
      </a-col>
    </a-row>
    <!-- Modal for calling video -->
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
/** ========================= FLOW SOCKET =============================
 * Emit: joinRoom (room)
 *
 * Emit: sendMess (msg) => Listener: receiveMess (msg)
 *
 * Emit: call-user ({ to, offer }) => Listener: call-made ({ to, offer })
 *
 * Emit: make-answer ({ to, offer }) => Listener: answer-made ({ to, offer })
 *
 */
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
      io: undefined,
      message: "",
      currentMessagesConversation: [],
      currentConversationInfo: {
        _id: undefined,
        avatar: "",
        username: "",
      },
      users: [],
      bindingClass: {
        author: "author",
        roomate: "roomate",
      },
      authorId: null,
      searchFriendValue: "",
      searchConversationValue: "",
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      peerConfig: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    };
  },
  created() {
    this.initSocket();
    this.getAuthorId();
    this.listenMessage();
    this.listenCall();
    this.listenAnswer();
    this.listenIceCandidates();
  },
  mounted() {
    this.getFriends();
  },
  watch: {
    openKeys(val) {
      console.log("openKeys", val);
    },
  },
  methods: {
    initSocket() {
      this.io = io.connect("http://localhost:3000/room");
    },
    async initPeerConnectionAndTrack() {
      await this.initLocalStream();
      this.setRemoteStream();
      this.peerConnection = new RTCPeerConnection(this.peerConfig);
      this.registerPeerConnectionListeners();

      /**
       * Track for local change
       */
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      /**
       * Listen IceCandidate to be added
       * Fix this by add to database
       */
      this.peerConnection.addEventListener("icecandidate", (event) => {
        if (!event.candidate) {
          console.log("Got final candidate!");
          return;
        }
        console.log("Got candidate: ", event.candidate);
        this.io.emit("sendIceCandidate", event.candidate.toJSON());
      });

      /**
       * Change stream will send to remote
       */
      this.peerConnection.addEventListener("track", (event) => {
        console.log("Got remote track:", event.streams[0]);
        event.streams[0].getTracks().forEach((track) => {
          console.log("Add a track to the remoteStream:", track);
          this.remoteStream.addTrack(track);
        });
      });
    },
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
    /**
     * Binding receiveMess event to socket
     */
    listenMessage() {
      this.io.on("receiveMess", (msg) => {
        const messageCtx = {
          id: this.currentMessagesConversation.length + 1,
          msg: msg,
          isAuthor: false,
        };
        this.currentMessagesConversation.push(messageCtx);
      });
    },
    async listenIceCandidates() {
      this.io.on("listenIceCanidate", async (candidate) => {
        console.log(
          `Got new remote ICE candidate: ${JSON.stringify(candidate)}`
        );
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });
    },
    /**
     * Send message via event sendMess in Server and then receive from receiveMess
     */
    sendMessage() {
      this.io.emit("sendMess", this.message);
      this.currentMessagesConversation = [
        ...this.currentMessagesConversation,
        {
          id: this.currentMessagesConversation.length,
          msg: this.message,
          isAuthor: true,
        },
      ];
      // Clear message
      this.message = "";
    },
    onOk() {
      this.visible = false;
    },
    onCancel() {
      this.visible = false;
    },
    /**
     * Get userId in localStorage
     */
    getAuthorId() {
      const info = localStorage.getItem("info");
      this.authorId = info.userId;
    },
    /**
     * Validate context to binding class
     */
    getAuthorContext(context) {
      return context.isAuthor
        ? this.bindingClass.author
        : this.bindingClass.roomate;
    },
    async getFriends() {
      const response = await axios.get(
        "http://localhost:3000/api/users/v1?offset=0&limit=10"
      );
      const {
        data: { data: friends },
      } = response;
      this.users = friends.map((friend, id) => {
        return {
          id,
          ...friend,
        };
      });
    },
    setCurrentConversationInfo(currentUserId) {
      const info = this.users.find((info) => info._id === currentUserId);
      this.currentConversationInfo = { ...info };
    },
    async initLocalStream() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      this.localStream = stream;
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
    },
    setRemoteStream() {
      const remoteStream = new MediaStream();
      this.remoteStream = remoteStream;
      const remoteVideo = document.getElementById("remote-video");
      remoteVideo.srcObject = this.remoteStream;
    },
    async listenCall() {
      this.io.on("call-made", async (data) => {
        this.visible = true;
        console.log(data);

        if (!this.peerConnection) {
          this.peerConnection = new RTCPeerConnection(this.peerConfig);
          await this.initPeerConnectionAndTrack();
        }

        if (
          !this.peerConnection.currentRemoteDescription &&
          data &&
          data.offer
        ) {
          console.log("Got remote description: ", data.offer);
          const rtcSessionDescription = new RTCSessionDescription(data.offer);
          await this.peerConnection.setRemoteDescription(rtcSessionDescription);

          /**
           * Create offer to send back
           */

          const localOffer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(localOffer);

          /**
           * Send call-listener offer back to caller
           */
          this.io.emit("make-answer", {
            offer: localOffer,
            to: data.to,
          });

          /**
           * Listen for candidate here to add ICE to peer
           */
        }
      });
    },
    // Setup socket answer-made to listen answer
    async listenAnswer() {
      this.io.on("answer-made", async (data) => {
        console.log("Listen answer response" + data);

        console.log("Got remote description: ", data.offer);
        const rtcSessionDescription = new RTCSessionDescription(data.offer);
        await this.peerConnection.setRemoteDescription(rtcSessionDescription);
      });
    },
    async loadConversation(currentUserId) {
      this.io.emit("joinRoom", currentUserId);
      this.setCurrentConversationInfo(currentUserId);
    },
    async searchFriend() {},
    async searchConversation() {},
    async emitOfferToCurrentConversation() {
      const currentUserId = this.currentConversationInfo._id;
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("Created offer:", offer);
      const peerInfo = {
        to: currentUserId,
        offer,
      };
      this.io.emit("call-user", peerInfo);
    },
    async startCallVideo() {
      this.visible = true;
      try {
        await this.initPeerConnectionAndTrack();

        await this.emitOfferToCurrentConversation();
      } catch (error) {
        this.visible = false;
        alert(error);
      }
    },
    registerPeerConnectionListeners() {
      this.peerConnection.addEventListener("icegatheringstatechange", () => {
        console.log(
          `ICE gathering state changed: ${this.peerConnection.iceGatheringState}`
        );
      });

      this.peerConnection.addEventListener("connectionstatechange", () => {
        console.log(
          `Connection state change: ${this.peerConnection.connectionState}`
        );
      });

      this.peerConnection.addEventListener("signalingstatechange", () => {
        console.log(
          `Signaling state change: ${this.peerConnection.signalingState}`
        );
      });

      this.peerConnection.addEventListener("iceconnectionstatechange ", () => {
        console.log(
          `ICE connection state change: ${this.peerConnection.iceConnectionState}`
        );
      });
    },
  },
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
