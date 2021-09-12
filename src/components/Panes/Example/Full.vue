<template>
  <div class="p-5">
    <div>
      <span class="cursor-pointer" @click="saveLayout">保存布局</span> |
      <span class="cursor-pointer" @click="recoverLayout">恢复布局</span>
    </div>
    <div>
      <!-- <span @click="togglePane('bottom', '10')">折叠底部</span> -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'Full',
  inject: ['loadLayout', 'getLayout', 'togglePane'],
  data: () => ({}),
  computed: {},
  methods: {
    saveLayout() {
      const json = JSON.stringify(this.getLayout());
      console.log('当前布局', json);
      localStorage.setItem('layout', json);
    },
    recoverLayout() {
      let layout = localStorage.getItem('layout');
      if (!layout) {
        alert('请先保存一遍布局');
        return;
      }
      layout = JSON.parse(layout);
      console.log('当前布局', layout);
      this.loadLayout(layout);
    },
  },
};
</script>

<style></style>
