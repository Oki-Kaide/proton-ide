<template>
  <Editor></Editor>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Editor from './components/Editor.vue';

@Options({
  components: {
    Editor
  },
})
export default class App extends Vue {}
</script>
