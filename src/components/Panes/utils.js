import ResizeObserver from 'resize-observer-polyfill';

export const titleBlockHeight = 22;

const resizeHandler = function(entries) {
  for (const entry of entries) {
    const listeners = entry.target.$resizeListeners || [];
    if (listeners.length) {
      listeners.forEach(fn => {
        fn();
      });
    }
  }
};

export const addResizeListener = function(el, fn) {
  if (!el.$resizeListeners) {
    el.$resizeListeners = [];
    el.$ro = new ResizeObserver(resizeHandler);
    el.$ro.observe(el);
  }
  el.$resizeListeners.push(fn);
};

export function debounce(func, wait, immediate = false) {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

export const removeResizeListener = function(el, fn) {
  if (!el || !el.$resizeListeners) return;
  el.$resizeListeners.splice(el.$resizeListeners.indexOf(fn), 1);
  if (!el.$resizeListeners.length) {
    el.$ro.disconnect();
  }
};

export function isNum(size) {
  return (size | 0) === size;
}

export function direction(comp, y, x) {
  return comp.horizontal ? y : x;
}

export function toSize(comp, size, panesDirection) {
  if (isNum(size) || !size) {
    return size;
  }
  const p = panesDirection || direction(comp, 'clientHeight', 'clientWidth');
  return (parseFloat(size) / comp.$el[p]) * 100;
}

export function padItem(item) {
  if (item._bind) {
    item._bind.unset();
    item._bind = null;
  }

  return {
    size: null,
    y: 0,
    x: 0,
    zIndex: 100,
    height: null,
    width: null,
    ...item,
  };
}

export function getSize(_, size) {
  return size;
}

export const svgs = {
  up: [
    'M860.553846 748.307692H163.446154c-19.692308 0-33.476923-25.6-17.723077-43.323077l340.676923-417.476923c11.815385-15.753846 37.415385-15.753846 49.230769 0l344.615385 417.476923c13.784615 17.723077 1.969231 43.323077-19.692308 43.323077z',
  ],
  fill: [
    'M514.652245 494.68413L85.929879 18.575586A47.896805 47.896805 0 1 0 14.748486 82.608203l455.989843 506.541908a47.79468 47.79468 0 0 0 43.913916 26.246224 47.692555 47.692555 0 0 0 43.913915-26.348349L1014.453878 82.608203a47.896805 47.896805 0 0 0-71.079267-64.032617L514.652245 494.68413z',
    'M514.652245 903.18567L85.929879 427.077126a47.896805 47.896805 0 1 0-71.181393 64.032616l455.989843 506.541909a47.79468 47.79468 0 0 0 43.913916 26.246224 47.692555 47.692555 0 0 0 43.913915-26.34835l455.887718-506.439783a47.896805 47.896805 0 1 0-71.079267-64.032616L514.652245 903.18567z',
  ],
  dot: ['M512 512m-160 0a160 160 0 1 0 320 0 160 160 0 1 0-320 0Z'],
  arrows: [
    'M96.196 671.807l415.804-415.632 415.803 415.632-63.616 63.445-352.209-352.017-352.102 352.017z',
  ],
  delete: [
    'M286.165333 798.165333L512 572.330667l225.834667 225.834666 60.330666-60.330666L572.330667 512l225.834666-225.834667-60.330666-60.330666L512 451.669333 286.165333 225.834667 225.834667 286.165333 451.669333 512l-225.834666 225.834667z',
  ],
  full: [
    'M237.1 294h557v435.7h-557zM774.5 128v41.3h136.7v164.9h48.1V128zM112.4 169.3h136.7V128H64.2v206.2h48.2zM911.2 854.3H774.5v41.3h184.8V689.4h-48.1zM112.4 689.4H64.2v206.2h184.9v-41.3H112.4z',
  ],
  detach: [
    'M781.66217017 208.63562012H478.29779029c-9.29937744 0-17.25402856 3.29260253-23.84417701 9.87780761-6.6049807 6.60992408-9.89758325 14.53491211-9.89758325 23.84417701v303.36932398c0 9.29937744 3.29260253 17.21942138 9.89758325 23.82934546 6.59014916 6.56542945 14.54479957 9.88275171 23.84417701 9.8827517h303.36437988c9.3092649 0 17.25402856-3.31732154 23.82934618-9.87780762 6.61486816-6.61486816 9.90252662-14.53491211 9.90252662-23.83428955V242.35760474c0-9.31420898-3.28765845-17.23425293-9.89758325-23.84417701-6.58520508-6.58520508-14.52502465-9.87780761-23.83428955-9.87780761z m-404.50561476 337.05175805V444.5659182H242.35266137c-9.31915307 0-17.22930884 3.30743408-23.86395263 9.87780762-6.56048608 6.6049807-9.87780761 14.53491211-9.87780762 23.84417701v303.3594358c0 9.31420898 3.31237817 17.27380347 9.87780762 23.78485155 6.63464379 6.69396997 14.54479957 9.88769508 23.86395263 9.88769508H545.71704125c9.29937744 0 17.23425293-3.19372583 23.85406447-9.88769508 6.56542945-6.51104737 9.87780761-14.47064185 9.87780762-23.77990747v-134.82861303H478.31756592c-27.89318824 0-51.76208497-9.86792016-71.51275611-29.6235354-19.74572778-19.75067115-29.62353539-43.5849607-29.62353539-71.47814966l-0.01977564-0.03955054zM478.30273437 141.21142578h303.36437988c27.92285133 0 51.74725342 9.86792016 71.50286866 29.62353539 19.75561523 19.75561523 29.62353539 43.58990479 29.62353539 71.48803711v303.36437989c0 27.9327395-9.86792016 51.72253442-29.62353539 71.49792456-19.75561523 19.74572778-43.58001733 29.62353539-71.50286865 29.62353539h-134.81872559v134.8187256c0 27.9327395-9.88275171 51.72253442-29.62847876 71.49792456-19.75561523 19.77539086-43.60473633 29.66308594-71.50286866 29.66308594H242.34771729c-27.90307641 0-51.75714087-9.88769508-71.51275612-29.66308594C151.07934594 833.35009742 141.21142578 809.55535913 141.21142578 781.62261963V478.27307128c0-27.91296386 9.86792016-51.75714087 29.62353539-71.50286865 19.75561523-19.75561523 43.60968041-29.61859131 71.51275612-29.6185913h134.81378149V242.32299828c0-27.89813232 9.87780761-51.73242188 29.62353539-71.48803711C426.54064942 151.07934594 450.37493896 141.21142578 478.29779029 141.21142578z',
  ],
};

export function createSvg(h, paths) {
  const p = [];
  for (const key in paths) {
    if (Object.hasOwnProperty.call(paths, key)) {
      const d = paths[key];
      p.push(
        h('path', {
          attrs: {
            d,
          },
        })
      );
    }
  }
  return h(
    'svg',
    {
      attrs: {
        width: 18,
        height: 18,
        viewBox: '0 0 1024 1024',
        xmlns: 'http://www.w3.org/2000/svg',
      },
    },
    p
  );
}

export function sumPrevPanesSize(panes, splitterIndex) {
  return panes.reduce(
    (total, pane, i) => total + (i < splitterIndex ? pane.size : 0),
    0
  );
}

export function sumNextPanesSize(panes, splitterIndex) {
  return panes.reduce(
    (total, pane, i) => total + (i > splitterIndex + 1 ? pane.size : 0),
    0
  );
}
