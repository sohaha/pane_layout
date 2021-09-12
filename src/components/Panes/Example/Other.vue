<template>
  <div class="py-5">
    <div>测试组件 {{ val }}</div>
  </div>
</template>

<script>
export default {
  name: 'Other',
  props: {
    val: {
      type: String,
      default: '',
    },
  },
  data() {
    return { data: this.val };
  },
  methods: {},
};
</script>

<style scoped></style>
