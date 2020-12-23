<template>
  <div>
    <a-card title="Login" :bordered="false" class="container">
      <a-form-model
        ref="ruleForm"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-model-item ref="email" label="Email" prop="email">
          <a-input v-model="form.email" />
        </a-form-model-item>

        <a-form-model-item ref="password" label="Password" prop="password">
          <a-input-password
            v-model="form.password"
            ref="password"
            prop="password"
          >
          </a-input-password>
        </a-form-model-item>

        <a-form-model-item :wrapper-col="{ span: 12, offset: 6 }">
          <a-button type="primary" @click="validateUser"> Login </a-button>
          <a-button style="margin-left: 10px" @click="resetForm">
            Reset
          </a-button>
        </a-form-model-item>
        <router-link to="register">
          Not have an account ? <b>Register here</b>
        </router-link>
      </a-form-model>
    </a-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Login",
  data() {
    return {
      labelCol: { span: 6 },
      wrapperCol: { span: 12 },
      form: {
        password: "",
        email: "",
      },
      rules: {
        password: [
          {
            required: true,
            message: "Please input password",
          },
          {
            min: 6,
            max: 10,
            message: "Length should be 6 to 10",
          },
        ],
        email: [
          {
            required: true,
            message: "Please input email",
          },
        ],
      },
    };
  },
  methods: {
    async validateUser(event) {
      event.preventDefault();
      try {
        const userResponse = await axios.post(
          "https://rtc-web-app.herokuapp.com/api/auth/v1/login",
          this.form
        );
        const {
          data: { data },
        } = userResponse;
        const { token, info } = data;
        localStorage.setItem("access_token", token);
        localStorage.setItem("info", JSON.stringify(info));
        window.location.href = "/";
      } catch (error) {
        console.log(error);
        const err = error.response.data.message;
        alert(err);
      }
    },
    onSubmit() {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          alert("submit!");
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.ruleForm.resetFields();
    },
  },
};
</script>

<style scoped>
.container {
  width: 700px;
  margin: 0 auto;
  text-align: center;
}
</style>
