<script>
import { direction, sumPrevPanesSize, sumNextPanesSize } from './utils';

export default {
  name: 'Panes',
  provide() {
    return {
      requestUpdate: this.requestUpdate,
      toggleResizable: this.toggleResizable,
      addPane: this.addPane,
      removePane: this.removePane,
      clickPane: this.clickPane,
    };
  },
  props: {
    horizontal: { type: Boolean },
    pushOtherPanes: { type: Boolean, default: true },
    rtl: { type: Boolean, default: false },
  },
  data: () => ({
    container: null,
    ready: false,
    panes: [],
    touch: {
      mouseDown: false,
      dragging: false,
      activeSplitter: null,
    },
  }),
  computed: {
    panesCount() {
      return this.panes.length;
    },
    indexedPanes() {
      return this.panes.reduce((obj, pane) => {
        obj[pane.id] = pane;
        return obj;
      }, {});
    },
  },
  watch: {
    panes: {
      deep: true,
      immediate: false,
      handler() {
        this.updatePaneComponents();
      },
    },
    horizontal() {
      this.updatePaneComponents();
    },
  },
  beforeDestroy() {
    this.ready = false;
  },
  mounted() {
    this.container = this.$refs.container;
    this.checkSplitpanesNodes();
    this.redoSplitters();
    this.resetPaneSizes();
    this.$emit('ready');
    this.ready = true;
  },
  methods: {
    update(pane) {
      if (!pane) return;
      const size = this.indexedPanes[pane.id].size;
      pane.update({
        [direction(this, 'height', 'width')]: size === null ? '' : `${size}%`,
      });
      if (size === null) {
        setTimeout(() => {
          this.indexedPanes[pane.id].size = pane.getSize();
        });
      }
    },
    updatePaneComponents() {
      this.panes.forEach(pane => {
        this.update(pane);
      });
    },
    bindEvents() {
      document.addEventListener('mousemove', this.onMouseMove, {
        passive: false,
      });
      document.addEventListener('mouseup', this.onMouseUp);
      if ('ontouchstart' in window) {
        document.addEventListener('touchmove', this.onMouseMove, {
          passive: false,
        });
        document.addEventListener('touchend', this.onMouseUp);
      }
    },
    unbindEvents() {
      document.removeEventListener('mousemove', this.onMouseMove, {
        passive: false,
      });
      document.removeEventListener('mouseup', this.onMouseUp);

      if ('ontouchstart' in window) {
        document.removeEventListener('touchmove', this.onMouseMove, {
          passive: false,
        });
        document.removeEventListener('touchend', this.onMouseUp);
      }
    },
    onMouseDown(_, splitterIndex) {
      this.bindEvents();
      this.touch.mouseDown = true;
      this.touch.activeSplitter = splitterIndex;
    },
    onMouseMove(event) {
      if (this.touch.mouseDown) {
        event.preventDefault();
        this.touch.dragging = true;
        this.calculatePanesSize(this.getCurrentMouseDrag(event));
        this.$emit(
          'resize',
          this.panes.map(pane => ({
            min: pane.min,
            max: pane.max,
            size: pane.size,
          }))
        );
      }
    },
    onMouseUp() {
      if (this.touch.dragging) {
        this.$emit(
          'resized',
          this.panes.map(pane => ({
            min: pane.min,
            max: pane.max,
            size: pane.size,
          }))
        );
      }
      this.touch.mouseDown = false;
      setTimeout(() => {
        this.touch.dragging = false;
        this.unbindEvents();
      }, 100);
    },
    onSplitterClick(event, splitterIndex) {
      if ('ontouchstart' in window) {
        event.preventDefault();
      }
      if (!this.touch.dragging)
        this.$emit('splitter-click', this.panes[splitterIndex]);
    },
    clickPane(event, paneId) {
      this.$emit('click', this.indexedPanes[paneId]);
    },
    getCurrentMouseDrag(event) {
      const rect = this.container.getBoundingClientRect();
      const { clientX, clientY } =
        'ontouchstart' in window && event.touches ? event.touches[0] : event;

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    getCurrentDragPercentage(drag) {
      let d = drag[direction(this, 'y', 'x')];
      const containerSize = this.container[
        direction(this, 'clientHeight', 'clientWidth')
      ];
      if (this.rtl && !this.horizontal) d = containerSize - d;

      return (d * 100) / containerSize;
    },
    calculatePanesSize(drag) {
      const splitterIndex = this.touch.activeSplitter;
      let sums = {
        prevPanesSize: sumPrevPanesSize(this.panes, splitterIndex),
        nextPanesSize: sumNextPanesSize(this.panes, splitterIndex),
        prevReachedMinPanes: 0,
        nextReachedMinPanes: 0,
      };

      const minDrag = 0 + (this.pushOtherPanes ? 0 : sums.prevPanesSize);
      const maxDrag = 100 - (this.pushOtherPanes ? 0 : sums.nextPanesSize);
      const dragPercentage = Math.max(
        Math.min(this.getCurrentDragPercentage(drag), maxDrag),
        minDrag
      );
      let panesToResize = [splitterIndex, splitterIndex + 1];
      let paneBefore = this.panes[panesToResize[0]] || null;
      let paneAfter = this.panes[panesToResize[1]] || null;

      const paneBeforeMaxReached =
        paneBefore.max < 100 &&
        dragPercentage >= paneBefore.max + sums.prevPanesSize;
      const paneAfterMaxReached =
        paneAfter.max < 100 &&
        dragPercentage <=
          100 -
            (paneAfter.max + sumNextPanesSize(this.panes, splitterIndex + 1));

      if (paneBeforeMaxReached || paneAfterMaxReached) {
        if (paneBeforeMaxReached) {
          paneBefore.size = paneBefore.max;
          paneAfter.size = Math.max(
            100 - paneBefore.max - sums.prevPanesSize - sums.nextPanesSize,
            0
          );
        } else {
          paneBefore.size = Math.max(
            100 -
              paneAfter.max -
              sums.prevPanesSize -
              sumNextPanesSize(this.panes, splitterIndex + 1),
            0
          );
          paneAfter.size = paneAfter.max;
        }
        return;
      }
      if (this.pushOtherPanes) {
        const vars = this.doPushOtherPanes(sums, dragPercentage);
        if (!vars) return;

        ({ sums, panesToResize } = vars);
        paneBefore = this.panes[panesToResize[0]] || null;
        paneAfter = this.panes[panesToResize[1]] || null;
      }

      if (paneBefore !== null) {
        paneBefore.size = Math.min(
          Math.max(
            dragPercentage - sums.prevPanesSize - sums.prevReachedMinPanes,
            paneBefore.min
          ),
          paneBefore.max
        );
      }
      if (paneAfter !== null) {
        paneAfter.size = Math.min(
          Math.max(
            100 -
              dragPercentage -
              sums.nextPanesSize -
              sums.nextReachedMinPanes,
            paneAfter.min
          ),
          paneAfter.max
        );
      }
    },
    doPushOtherPanes(sums, dragPercentage) {
      const splitterIndex = this.touch.activeSplitter;
      const panesToResize = [splitterIndex, splitterIndex + 1];
      if (
        dragPercentage <
        sums.prevPanesSize + this.panes[panesToResize[0]].min
      ) {
        panesToResize[0] = this.findPrevExpandedPane(splitterIndex).index;

        sums.prevReachedMinPanes = 0;
        if (panesToResize[0] < splitterIndex) {
          this.panes.forEach((pane, i) => {
            if (i > panesToResize[0] && i <= splitterIndex) {
              pane.size = pane.min;
              sums.prevReachedMinPanes += pane.min;
            }
          });
        }
        sums.prevPanesSize = sumPrevPanesSize(this.panes, panesToResize[0]);
        if (panesToResize[0] === undefined) {
          sums.prevReachedMinPanes = 0;
          this.panes[0].size = this.panes[0].min;
          this.panes.forEach((pane, i) => {
            if (i > 0 && i <= splitterIndex) {
              pane.size = pane.min;
              sums.prevReachedMinPanes += pane.min;
            }
          });
          this.panes[panesToResize[1]].size =
            100 -
            sums.prevReachedMinPanes -
            this.panes[0].min -
            sums.prevPanesSize -
            sums.nextPanesSize;
          return null;
        }
      }
      if (
        dragPercentage >
        100 - sums.nextPanesSize - this.panes[panesToResize[1]].min
      ) {
        panesToResize[1] = this.findNextExpandedPane(splitterIndex).index;
        sums.nextReachedMinPanes = 0;
        if (panesToResize[1] > splitterIndex + 1) {
          this.panes.forEach((pane, i) => {
            if (i > splitterIndex && i < panesToResize[1]) {
              pane.size = pane.min;
              sums.nextReachedMinPanes += pane.min;
            }
          });
        }
        sums.nextPanesSize = sumNextPanesSize(this.panes, panesToResize[1] - 1);
        if (panesToResize[1] === undefined) {
          sums.nextReachedMinPanes = 0;
          this.panes[this.panesCount - 1].size = this.panes[
            this.panesCount - 1
          ].min;
          this.panes.forEach((pane, i) => {
            if (i < this.panesCount - 1 && i >= splitterIndex + 1) {
              pane.size = pane.min;
              sums.nextReachedMinPanes += pane.min;
            }
          });
          this.panes[panesToResize[0]].size =
            100 -
            sums.prevPanesSize -
            sums.nextReachedMinPanes -
            this.panes[this.panesCount - 1].min -
            sums.nextPanesSize;
          return null;
        }
      }
      return { sums, panesToResize };
    },
    findPrevExpandedPane(splitterIndex) {
      const pane = [...this.panes]
        .reverse()
        .find(p => p.index < splitterIndex && p.size > p.min);
      return pane || {};
    },
    findNextExpandedPane(splitterIndex) {
      const pane = this.panes.find(
        p => p.index > splitterIndex + 1 && p.size > p.min
      );
      return pane || {};
    },
    checkSplitpanesNodes() {
      const children = Array.from(this.container.children);
      children.forEach(child => {
        const isPane = child.classList.contains('panes__pane');
        const isSplitter = child.classList.contains('panes__splitter');

        if (!isPane && !isSplitter) {
          child.parentNode.removeChild(child);
          return;
        }
      });
    },
    addSplitter(paneIndex, nextPaneNode, isVeryFirst = false) {
      const splitterIndex = paneIndex - 1;
      const elm = document.createElement('div');
      elm.classList.add('panes__splitter');
      if (!isVeryFirst) {
        elm.onmousedown = event => this.onMouseDown(event, splitterIndex);

        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          elm.ontouchstart = event => this.onMouseDown(event, splitterIndex);
        }
        elm.onclick = event => this.onSplitterClick(event, splitterIndex + 1);
      }
      if (this.panes[paneIndex]) {
        this.$set(this.panes[paneIndex], 'toggleResizable', state => {
          const display = (typeof state === 'undefined'
          ? elm.style.display
          : state)
            ? ''
            : 'none';
          elm.style.display = display;
        });
      }
      nextPaneNode.parentNode.insertBefore(elm, nextPaneNode);
    },
    removeSplitter(node) {
      node.onmousedown = undefined;
      node.onclick = undefined;
      node.ondblclick = undefined;
      node.parentNode.removeChild(node);
    },
    redoSplitters() {
      const children = Array.from(this.container.children);
      children.forEach(el => {
        if (el.className.includes('panes__splitter')) this.removeSplitter(el);
      });
      let paneIndex = 0;
      children.forEach(el => {
        if (el.className.includes('panes__pane')) {
          if (paneIndex) this.addSplitter(paneIndex, el);
          paneIndex++;
        }
      });
    },
    toggleResizable({ target, state }) {
      const pane = this.indexedPanes[target._uid];
      if (pane) {
        pane.toggleResizable(state);
      }
    },
    requestUpdate({ target, ...args }) {
      const pane = this.indexedPanes[target._uid];
      Object.entries(args).forEach(([key, value]) => {
        pane[key] = value;
      });
    },
    addPane(pane) {
      let index = -1;
      Array.from(pane.$el.parentNode.children).some(el => {
        if (el.className.includes('panes__pane')) index++;
        return el === pane.$el;
      });
      const min = pane.minSize;
      const max = pane.maxSize;
      const size = pane.size;

      this.panes.push({
        id: pane._uid,
        index,
        min: isNaN(min) ? 0 : min,
        max: isNaN(max) ? 100 : max,
        size: size === null ? null : size,
        givenSize: size,
        update: pane.update,
        getSize: pane.getSize,
      });

      if (this.ready) {
        this.$nextTick(() => {
          this.redoSplitters();
          this.resetPaneSizes({ addedPane: this.panes[index] });
          this.$emit('add', {
            index,
            panes: this.panes,
          });
        });
      }
    },
    removePane(pane) {
      const index = this.panes.findIndex(p => p.id === pane._uid);
      const removed = this.panes.splice(index, 1)[0];
      this.panes.forEach((p, i) => {
        p.index = i;
      });

      this.$nextTick(() => {
        this.redoSplitters();
        this.resetPaneSizes({ removedPane: { ...removed, index } });
        this.$emit('remove', {
          removed,
          panes: this.panes,
        });
      });
    },
    resetPaneSizes(changedPanes = {}) {
      if (!changedPanes.addedPane && !changedPanes.removedPane) {
        this.initSize();
      } else if (this.panes.length === 1) {
        this.panes[0].size = 100;
      } else if (
        this.panes.some(
          pane => pane.givenSize !== null || pane.min || pane.max < 100
        )
      ) {
        this.equalizeAfter(changedPanes);
      } else {
        this.equalize();
      }

      if (this.ready) this.$emit('resized', this.panes);
    },
    equalize() {
      const equalSpace = 100 / this.panesCount;
      let leftToAllocate = 0;
      const ungrowable = [];
      const unshrinkable = [];

      this.panes.forEach(pane => {
        pane.size = Math.max(Math.min(equalSpace, pane.max), pane.min);

        leftToAllocate -= pane.size;
        if (pane.size >= pane.max) ungrowable.push(pane.id);
        if (pane.size <= pane.min) unshrinkable.push(pane.id);
      });

      if (leftToAllocate > 0.1)
        this.readjustSizes(leftToAllocate, ungrowable, unshrinkable);
    },
    initSize() {
      let leftToAllocate = 100;
      const ungrowable = [];
      const unshrinkable = [];
      let definedSizes = 0;

      this.panes.forEach(pane => {
        leftToAllocate -= pane.size;
        if (pane.size !== null) definedSizes++;
        if (pane.size >= pane.max) ungrowable.push(pane.id);
        if (pane.size <= pane.min) unshrinkable.push(pane.id);
      });

      let leftToAllocate2 = 100;
      if (leftToAllocate > 0.1) {
        this.panes.forEach(pane => {
          if (pane.size === null) {
            pane.size = Math.max(
              Math.min(
                leftToAllocate / (this.panesCount - definedSizes),
                pane.max
              ),
              pane.min
            );
          }
          leftToAllocate2 -= pane.size;
        });

        if (leftToAllocate2 > 0.1)
          this.readjustSizes(leftToAllocate, ungrowable, unshrinkable);
      }
    },
    equalizeAfter({ addedPane } = {}) {
      let equalSpace = 100 / this.panesCount;
      let leftToAllocate = 0;
      const ungrowable = [];
      const unshrinkable = [];
      if (addedPane && addedPane.givenSize !== null) {
        equalSpace = (100 - addedPane.givenSize) / (this.panesCount - 1);
      }

      this.panes.forEach(pane => {
        leftToAllocate -= pane.size;
        if (pane.size >= pane.max) ungrowable.push(pane.id);
        if (pane.size <= pane.min) unshrinkable.push(pane.id);
      });

      if (Math.abs(leftToAllocate) < 0.1) return;

      this.panes.forEach(pane => {
        if (
          !(
            addedPane &&
            addedPane.givenSize !== null &&
            addedPane.id === pane.id
          )
        )
          pane.size =
            this.panes.length === 1
              ? 100
              : Math.max(Math.min(equalSpace, pane.max), pane.min);

        leftToAllocate -= pane.size;
        if (pane.size >= pane.max) ungrowable.push(pane.id);
        if (pane.size <= pane.min) unshrinkable.push(pane.id);
      });

      if (leftToAllocate > 0.1)
        this.readjustSizes(leftToAllocate, ungrowable, unshrinkable);
    },
    readjustSizes(left, ungrowable, unshrinkable) {
      let equalSpaceToAllocate;
      let leftToAllocate = left;
      if (leftToAllocate > 0) {
        equalSpaceToAllocate =
          leftToAllocate / (this.panesCount - ungrowable.length);
      } else {
        equalSpaceToAllocate =
          leftToAllocate / (this.panesCount - unshrinkable.length);
      }

      this.panes.forEach(pane => {
        if (leftToAllocate > 0 && !ungrowable.includes(pane.id)) {
          const newPaneSize = Math.max(
            Math.min(pane.size + equalSpaceToAllocate, pane.max),
            pane.min
          );
          const allocated = newPaneSize - pane.size;
          leftToAllocate -= allocated;
          pane.size = newPaneSize;
        } else if (!unshrinkable.includes(pane.id)) {
          const newPaneSize = Math.max(
            Math.min(pane.size + equalSpaceToAllocate, pane.max),
            pane.min
          );
          const allocated = newPaneSize - pane.size;
          leftToAllocate -= allocated;
          pane.size = newPaneSize;
        }

        this.update(pane);
      });
    },
  },
  render(h) {
    return h(
      'div',
      {
        ref: 'container',
        class: [
          'panes',
          `panes--${direction(this, 'horizontal', 'vertical')}`,
          {
            'panes--dragging': this.touch.dragging,
          },
        ],
      },
      this.$slots.default
    );
  },
};
</script>

<style lang="less">
.panes {
  display: flex;
  width: 100%;
  height: 100%;
  &--vertical {
    flex-direction: row;
  }
  &--horizontal {
    flex-direction: column;
  }
  &--dragging * {
    user-select: none;
  }

  &__pane {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .panes--vertical > & {
      transition: width 0.1s ease-out;
    }
    .panes--horizontal > & {
      transition: height 0.1s ease-out;
    }
    .panes--dragging > & {
      transition: none;
    }
  }

  &__splitter {
    position: relative;
    touch-action: none;
  }
  &--vertical > .panes__splitter {
    min-width: 1px;
    cursor: col-resize;
  }
  &--horizontal > .panes__splitter {
    min-height: 1px;
    cursor: row-resize;
  }
}
</style>
