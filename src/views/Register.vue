<template>
  <div>
    <a-card title="Register" :bordered="false" class="container">
      <a-form-model
        ref="ruleForm"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-model-item ref="username" label="Username" prop="username">
          <a-input v-model="form.username" />
        </a-form-model-item>

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

        <a-form-model-item
          ref="confirmPassword"
          label="Confirm"
          prop="confirmPassword"
        >
          <a-input-password
            ref="confirmPassword"
            v-model="form.confirmPassword"
          >
          </a-input-password>
        </a-form-model-item>

        <a-form-model-item :wrapper-col="{ span: 12, offset: 6 }">
          <a-button type="primary" @click="validateUser">
            Create
          </a-button>
          <a-button style="margin-left: 10px;" @click="resetForm">
            Reset
          </a-button>
        </a-form-model-item>
        <router-link to="login">
          <b>Login</b>
        </router-link>
      </a-form-model>
    </a-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Register",
  data() {
    return {
      labelCol: { span: 6 },
      wrapperCol: { span: 12 },
      form: {
        username: "",
        password: "",
        email: "",
        confirmPassword: ""
      },
      rules: {
        username: [
          {
            required: true,
            message: "Please input username"
          },
          {
            min: 3,
            max: 8,
            message: "Length should be 3 to 8"
          }
        ],
        password: [
          {
            required: true,
            message: "Please input password"
          },
          {
            min: 6,
            max: 10,
            message: "Length should be 6 to 10"
          }
        ],
        email: [
          {
            required: true,
            message: "Please input email"
          }
        ],
        confirmPassword: [
          {
            required: true,
            message: "Please input password"
          },
          {
            min: 6,
            max: 10,
            message: "Length should be 6 to 10"
          }
        ]
      }
    };
  },
  methods: {
    async validateUser(event) {
      event.preventDefault();
      this.onSubmit();
      try {
        const userResponse = await axios.post(
          "http://localhost:3000/api/auth/v1/register",
          this.form
        );
        const {
          data: { data }
        } = userResponse;
        const { token, info } = data;
        localStorage.setItem("access_token", token);
        localStorage.setItem("info", JSON.stringify(info));
        window.location.href = "/";
      } catch (error) {
        const err = error.response.data.message;
        alert(err);
      }
    },
    onSubmit() {
      this.$refs.ruleForm.validate(valid => {
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
    }
  }
};
</script>

<style scoped>
.container {
  width: 700px;
  margin: 0 auto;
  text-align: center;
}
</style>
