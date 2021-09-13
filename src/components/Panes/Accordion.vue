<script>
import interact from 'interactjs';
import TitleBlock from './TitleBlock';
import {
  titleBlockHeight,
  addResizeListener,
  removeResizeListener,
  debounce
} from './utils';

export default {
  name: 'Accordion',
  inject: ['layoutRef', 'itemRef'],
  component: { TitleBlock },
  props: {
    items: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  data: () => ({
    recalcFillDebounce: null,
  }),
  watch: {
    items() {
      this.init();
      this.recalcFill();
    },
  },
  mounted() {
    this.recalcFill();
    const resizeListener = debounce(this.recalcFill, 10, false);
    addResizeListener(this.itemRef().$el, resizeListener);
    this.$once('hook:destroyed', () => {
      removeResizeListener(this.itemRef().$el, resizeListener);
    });
    this.init();
  },
  beforeDestroy() {
    this.items.forEach(item => {
      if (!item._bind) return;
      item._bind.unset && item._bind.unset();
      item._bind = null;
    });
  },
  methods: {
    init() {
      this.$nextTick(() => {
        this.items.forEach((_, index) => {
          this.bindBoard(index);
        });
      });
    },
    recalcFill() {
      const index = this.items.findIndex(item => {
        return !!item.fill && !item.detach;
      });
      if (index >= 0) {
        setTimeout(() => this.fill(index), 100);
      }
    },
    layoutSize() {
      const el = this.layoutRef().$el;
      return { width: el.clientWidth, height: el.clientHeight };
    },
    bindBoard(index) {
      if (this.items[index]._bind) {
        return;
      }
      const name = 'item_' + index;
      this.items[index]._bind = true;
      setTimeout(() => {
        const board = this.$refs[name];
        if (!board) return;
        const interactObj = interact(board);
        let x;
        let y;
        const item = this.items[index];

        interactObj.draggable({
          preventDefault: 'always',
          allowFrom: '.title__bolck',
          enabled: this.items[index].detach,
          listeners: {
            start: () => {
              x = item.x || 0;
              y = item.y || 0;
              if (item.zIndex <= this.layoutRef().maxIndex) {
                item.zIndex = this.layoutRef().maxIndex + 1;
              }
            },
            move: event => {
              x = (parseFloat(x) || 0) + event.dx;
              y = (parseFloat(y) || 0) + event.dy;
              event.target.style.transform = `translate(${x}px, ${y}px)`;
            },
            end: () => {
              item.x = x;
              item.y = y;
              this.layoutRef().maxIndex = item.zIndex;
            },
          },
        });

        interactObj.resizable({
          ...this.resizableOptions(index),
          allowFrom: '.tools--board',
          listeners: {
            start(event) {
              x = item.x || 0;
              y = item.y || 0;
              event.target.classList.remove('board__transition');
            },
            move(event) {
              event.stopPropagation();
              const v = { height: `${event.rect.height}px` };
              if (item.detach) {
                x = (parseFloat(x) || 0) + event.deltaRect.left;
                y = (parseFloat(y) || 0) + event.deltaRect.top;
                v['width'] = `${event.rect.width}px`;
                v['transform'] = `translate(${x}px, ${y}px)`;
              }
              Object.assign(event.target.style, v);
            },
            end(event) {
              event.target.classList.add('board__transition');
              item.fill = false;
              item.x = x;
              item.y = y;
              if (event.rect.height <= titleBlockHeight) {
                item.open = false;
              } else {
                item.open = true;
                if (item.detach) {
                  item.height = board.offsetHeight + 'px';
                  item.width = board.offsetWidth + 'px';
                } else {
                  item.size = board.offsetHeight + 'px';
                }
              }
            },
          },
        });

        this.items[index]._bind = interactObj;
        this.initArrt(board, index);
      }, 10);
    },
    initArrt(board, index) {
      const { x, y, detach } = this.items[index];
      if ((x !== null || y !== null) && detach) {
        Object.assign(board.style, {
          transform: `translate(${x || 0}px, ${y || 0}px)`,
        });
      }
    },
    boardClass(index) {
      return {
        item: true,
        board: true,
        board__transition: true,
        open: this.items[index].open,
        full: this.items[index].full,
        detach: this.items[index].detach,
      };
    },
    movePlace(index, place) {
      const offset = place;
      const idx = Number(index);
      const item = this.items[index];
      const len = this.items.length;
      let tmpItem;
      let next;
      let i = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        next = idx + offset + i;
        if (next > len || next < 0) {
          return;
        }
        tmpItem = this.items[next];
        if (!tmpItem) {
          return;
        }
        if (!tmpItem.detach) {
          break;
        }
        if (offset > 0) {
          i++;
        } else {
          i--;
        }
      }

      this.$set(this.items, next, item);
      this.$set(this.items, index, tmpItem);
    },
    detachStyle(index) {
      const {
        detach,
        width,
        height,
        open,
        size,
        zIndex,
        full,
        x,
        y,
      } = this.items[index];
      const style = {
        width,
        height: open ? height : `${titleBlockHeight}px`,
        zIndex: full ? this.layoutRef().maxIndex + 1 : zIndex,
        transform: `translate(${x || 0}px, ${y || 0}px)`,
      };
      if (!detach) {
        style.width = 'auto';
        style.transform = 'none';
        style.height = open ? size || 'auto' : `${titleBlockHeight}px`;
      }
      return style;
    },
    resizableOptions(index) {
      const options = {
        edges: { bottom: true, top: false, left: false, right: false },
        modifiers: [],
      };
      if (this.items[index].detach) {
        options.edges = { bottom: true, top: false, left: true, right: true };
        options.modifiers = [
          interact.modifiers.restrictSize({
            min: { width: 50, height: 26 },
          }),
        ];
      }
      return options;
    },
    fill(index) {
      let titleSum = 0;
      this.items.forEach((item, itemIndex) => {
        if (itemIndex !== Number(index)) {
          if (!item.detach) titleSum++;
          this.$set(this.items[itemIndex], 'fill', false);
          this.$set(
            this.items[itemIndex],
            'open',
            !item.detach ? false : item.open
          );
          return;
        }
        this.$set(this.items[itemIndex], 'fill', true);
        this.$set(this.items[itemIndex], 'open', true);
      });

      const offsetHeight =
        this.itemRef().$el.offsetHeight - titleBlockHeight * titleSum;
      this.items[index].size = `${offsetHeight}px`;
    },
    full(index) {
      const full = !this.items[index].full;
      this.$set(this.items[index], 'full', full);
      const board = this.items[index]._bind;
      if (full) {
        this.$set(this.items[index], 'open', true);
        board.options.drag.enabled = false;
      } else {
        board.options.drag.enabled = this.items[index].detach;
      }
    },
    detach(index) {
      const detach = !this.items[index].detach;
      this.$set(this.items[index], 'detach', detach);
      const board = this.items[index]._bind;
      if (detach) {
        this.$set(this.items[index], 'open', true);
      }
      board.resizable({
        ...this.resizableOptions(index),
      });
      board.options.drag.enabled = detach;
      this.recalcFill();
    },
    remove(index) {
      this.$emit('remove', index);
    },
    toggle(index) {
      if (this.items[index].full) return;
      this.$set(this.items[index], 'open', !this.items[index].open);
      if (this.items[index].height === '0px') {
        this.items[index].height = null;
      }
    },
  },
  render(h) {
    const items = [];
    for (const index in this.items) {
      if (Object.hasOwnProperty.call(this.items, index)) {
        const item = this.items[index];

        const children = [
          h(TitleBlock, {
            props: {
              index: Number(index),
              item: this.items[index],
            },
            on: {
              handle: (event, name) => {
                event.stopPropagation();
                if (typeof this[name] !== 'function') {
                  return;
                }

                this[name](index);
              },
            },
          }),

          h(
            'div',
            {
              class: 'tools--board',
            },
            [
              h(
                'div',
                {
                  style: {},
                },
                [
                  h(item.component, {
                    props: item.props || {},
                    on: item.on || {},
                  }),
                ]
              ),
            ]
          ),
        ];

        items.push(
          h(
            'div',
            {
              ref: 'item_' + index,
              key: item._key || index,
              class: this.boardClass(index),
              style: this.detachStyle(index),
              on: {
                dragstart: event => {
                  event.dataTransfer.dropEffect = 'move';
                  event.dataTransfer.setDragImage &&
                    event.dataTransfer.setDragImage(
                      event.target.children[0],
                      0,
                      0
                    );
                  event.dataTransfer.setData(
                    'Text',
                    JSON.stringify({
                      place: this.itemRef().alias,
                      index,
                    })
                  );
                },
              },
              attrs: {
                'data-index': index,
                draggable: !item.full && !item.detach,
              },
            },
            [children]
          )
        );
      }
    }
    return h(
      'div',
      {
        class: 'accotdion',
      },
      items
    );
  },
};
</script>

<style lang="less" scoped>
@import './utils.less';
@titleHeight: var(--pane-layout-title-height);

.accotdion {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  user-select: none;
  overflow: auto;
  touch-action: none;
}

.tools--board {
  overflow: auto;
  height: calc(100% - @titleHeight);
  & > div {
    position: relative;
    &[style*='ns-resize']:after {
      opacity: 1;
    }
    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 4px;
      transition: opacity 0.4s;
      background-color: rgba(0, 0, 0, 0.05);
      opacity: 0;
      z-index: 100;
    }
  }
}

.board {
  background: #fff;
  height: @titleHeight;
  overflow: hidden;
  &__transition {
    transition: height 0.3s;
  }
  &[style*='move'] {
    opacity: 0.9;
  }
  &.open {
    height: auto;
    overflow: auto;
    /deep/ .tools--toggle {
      transform: rotate(180deg);
    }
  }
  &.detach {
    position: absolute;
    z-index: 100;
    left: 0;
    top: 0;
    box-shadow: 1px 1px 3px #484545;
    border: 1px solid #ddd;
    /deep/& {
      .tools--fill,
      .tools--delete {
        visibility: hidden !important;
      }
    }
  }
  &.full {
    position: absolute;
    z-index: 1000;
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
    border: 0 !important;
    box-shadow: 1px 1px 3px #484545;
    /deep/& {
      .tools--detach,
      .tools--fill,
      .tools--delete {
        visibility: hidden !important;
      }
    }
  }
}
</style>
