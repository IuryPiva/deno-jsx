const detectSSR = () => {
  const isDeno = typeof Deno !== "undefined";
  const hasWindow = typeof window !== "undefined" ? true : false;
  return typeof _nano !== "undefined" && _nano.isSSR || isDeno || !hasWindow;
};
function isDescendant(desc, root) {
  return !!desc && (desc === root || isDescendant(desc.parentNode, root));
}
const onNodeRemove = (element, callback) => {
  let observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.removedNodes.forEach((removed) => {
        if (isDescendant(element, removed)) {
          callback();
          if (observer) {
            observer.disconnect();
            observer = undefined;
          }
        }
      });
    });
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
  return observer;
};
const escapeHtml = (unsafe) => {
  if (unsafe && typeof unsafe === "string") {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
      />/g,
      "&gt;",
    ).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  return unsafe;
};
class HTMLElementSSR {
  tagName;
  isSelfClosing = false;
  nodeType = null;
  _ssr;
  constructor(tag) {
    this.tagName = tag;
    const selfClosing = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];
    this.nodeType = 1;
    if (selfClosing.indexOf(tag) >= 0) {
      this._ssr = `<${tag} />`;
      this.isSelfClosing = true;
    } else {
      this._ssr = `<${tag}></${tag}>`;
    }
  }
  get outerHTML() {
    return this.toString();
  }
  get innerHTML() {
    return this.innerText;
  }
  set innerHTML(text) {
    this.innerText = text;
  }
  get innerText() {
    const reg = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
    return reg.exec(this._ssr)?.[2] || "";
  }
  set innerText(text) {
    const reg = /(^<[^>]+>)(.+)?(<\/[a-z]+>$|\/>$)/gm;
    this._ssr = this._ssr.replace(reg, `$1${text}$3`);
  }
  getAttribute(_name) {
    return null;
  }
  get classList() {
    const element = this._ssr;
    const classesRegex = /^<\w+.+(\sclass=")([^"]+)"/gm;
    return {
      add: (name) => {
        this.setAttribute("class", name);
      },
      entries: {
        get length() {
          const classes = classesRegex.exec(element);
          if (classes && classes[2]) return classes[2].split(" ").length;
          return 0;
        },
      },
    };
  }
  toString() {
    return this._ssr;
  }
  setAttributeNS(_namespace, name, value) {
    this.setAttribute(name, value);
  }
  setAttribute(name, value) {
    if (this.isSelfClosing) {
      this._ssr = this._ssr.replace(
        /(^<[a-z]+ )(.+)/gm,
        `$1${escapeHtml(name)}="${escapeHtml(value)}" $2`,
      );
    } else {
      this._ssr = this._ssr.replace(
        /(^<[^>]+)(.+)/gm,
        `$1 ${escapeHtml(name)}="${escapeHtml(value)}"$2`,
      );
    }
  }
  append(child) {
    this.appendChild(child);
  }
  appendChild(child) {
    const index = this._ssr.lastIndexOf("</");
    this._ssr = this._ssr.substring(0, index) + child +
      this._ssr.substring(index);
  }
  get children() {
    const reg = /<([a-z]+)((?!<\/\1).)*<\/\1>/gms;
    const array = [];
    let match;
    while ((match = reg.exec(this.innerHTML)) !== null) {
      array.push(match[0].replace(/[\s]+/gm, " "));
    }
    return array;
  }
  addEventListener(_type, _listener, _options) {
  }
}
class DocumentSSR {
  body;
  head;
  constructor() {
    this.body = this.createElement("body");
    this.head = this.createElement("head");
  }
  createElement(tag) {
    return new HTMLElementSSR(tag);
  }
  createElementNS(_URI, tag) {
    return this.createElement(tag);
  }
  createTextNode(text) {
    return escapeHtml(text);
  }
  querySelector(_query) {
    return undefined;
  }
}
const documentSSR = () => {
  return new DocumentSSR();
};
const isSSR = () => typeof _nano !== "undefined" && _nano.isSSR === true;
const tick = typeof Promise == "function"
  ? Promise.prototype.then.bind(Promise.resolve())
  : setTimeout;
const removeAllChildNodes = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
const strToHash = (s) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(32);
};
const appendChildren = (element, children, escape = true) => {
  if (!Array.isArray(children)) {
    appendChildren(element, [
      children,
    ], escape);
    return;
  }
  if (typeof children === "object") {
    children = Array.prototype.slice.call(children);
  }
  children.forEach((child) => {
    if (Array.isArray(child)) appendChildren(element, child, escape);
    else {
      const c = _render(child);
      if (typeof c !== "undefined") {
        if (Array.isArray(c)) appendChildren(element, c, escape);
        else {
          if (isSSR() && !escape) {
            element.appendChild(c.nodeType == null ? c.toString() : c);
          } else {
            element.appendChild(
              c.nodeType == null ? document.createTextNode(c.toString()) : c,
            );
          }
        }
      }
    }
  });
};
const SVG = (props) => {
  const child = props.children[0];
  const attrs = child.attributes;
  if (isSSR()) return child;
  const svg = hNS("svg");
  for (let i = attrs.length - 1; i >= 0; i--) {
    svg.setAttribute(attrs[i].name, attrs[i].value);
  }
  svg.innerHTML = child.innerHTML;
  return svg;
};
const render = (component, parent = null, removeChildNodes = true) => {
  let el = _render(component);
  if (Array.isArray(el)) {
    el = el.map((e) => _render(e));
    if (el.length === 1) el = el[0];
  }
  if (parent) {
    if (removeChildNodes) removeAllChildNodes(parent);
    if (el && parent.id && parent.id === el.id && parent.parentElement) {
      parent.parentElement.replaceChild(el, parent);
    } else {
      if (Array.isArray(el)) {
        el.forEach((e) => {
          appendChildren(parent, _render(e));
        });
      } else appendChildren(parent, _render(el));
    }
    return parent;
  } else {
    if (isSSR() && !Array.isArray(el)) {
      return [
        el,
      ];
    }
    return el;
  }
};
const _render = (comp) => {
  if (typeof comp === "undefined") return [];
  if (comp == null) return [];
  if (typeof comp === "string") return comp;
  if (typeof comp === "number") return comp.toString();
  if (comp.tagName && comp.tagName.toLowerCase() === "svg") {
    return SVG({
      children: [
        comp,
      ],
    });
  }
  if (comp.tagName) return comp;
  if (comp && comp.component && comp.component.isClass) {
    return renderClassComponent(comp);
  }
  if (comp.component && typeof comp.component === "function") {
    return renderFunctionalComponent(comp);
  }
  if (Array.isArray(comp)) return comp.map((c) => _render(c)).flat();
  if (typeof comp === "function" && !comp.isClass) return _render(comp());
  if (
    comp.component && comp.component.tagName &&
    typeof comp.component.tagName === "string"
  ) {
    return _render(comp.component);
  }
  if (Array.isArray(comp.component)) return _render(comp.component);
  if (comp.component) return _render(comp.component);
  if (typeof comp === "object") return [];
  if (comp.isClass) return new comp().render();
  console.warn("Something unexpected happened with:", comp);
};
const renderFunctionalComponent = (fncComp) => {
  const { component, props } = fncComp;
  return _render(component(props));
};
const renderClassComponent = (classComp) => {
  const { component, props } = classComp;
  const hash = strToHash(component.toString());
  component.prototype._getHash = () => hash;
  const Component = new component(props);
  Component.willMount();
  let el = Component.render();
  el = _render(el);
  Component.elements = el;
  if (props && props.ref) props.ref(Component);
  if (!isSSR()) {
    tick(() => {
      Component._didMount();
    });
  }
  return el;
};
const hNS = (tag) =>
  document.createElementNS("http://www.w3.org/2000/svg", tag);
const h = (tagNameOrComponent, props, ...children) => {
  if (
    isSSR() && typeof tagNameOrComponent === "string" &&
    tagNameOrComponent.includes("-") &&
    _nano.customElements.has(tagNameOrComponent)
  ) {
    const customElement = _nano.customElements.get(tagNameOrComponent);
    const component = _render({
      component: customElement,
      props: {
        ...props,
        children: children,
      },
    });
    const match = component.toString().match(
      /^<(?<tag>[a-z]+)>(.*)<\/\k<tag>>$/,
    );
    if (match) {
      const element = new HTMLElementSSR(match[1]);
      element.innerText = match[2];
      element.innerText = element.innerText.replace(
        /\son\w+={[^}]+}|\son\w+="[^}]+"/gm,
        "",
      );
      return element;
    } else {
      return "COULD NOT RENDER WEB-COMPONENT";
    }
  }
  if (typeof tagNameOrComponent !== "string") {
    return {
      component: tagNameOrComponent,
      props: {
        ...props,
        children: children,
      },
    };
  }
  let ref;
  const element = tagNameOrComponent === "svg"
    ? hNS("svg")
    : document.createElement(tagNameOrComponent);
  const isEvent = (el, p) => {
    if (0 !== p.indexOf("on")) return false;
    if (el.ssr) return true;
    return typeof el[p] === "object" || typeof el[p] === "function";
  };
  for (const p in props) {
    if (p === "style" && typeof props[p] === "object") {
      const styles = Object.keys(props[p]).map((k) => `${k}:${props[p][k]}`)
        .join(";").replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      props[p] = `${styles};`;
    }
    if (p === "ref") ref = props[p];
    else if (isEvent(element, p.toLowerCase())) {
      element.addEventListener(p.toLowerCase().substring(2), (e) =>
        props[p](e));
    } else if (p === "dangerouslySetInnerHTML") {
      if (!isSSR()) {
        const fragment = document.createElement("fragment");
        fragment.innerHTML = props[p].__html;
        element.appendChild(fragment);
      } else {
        element.innerHTML = props[p].__html;
      }
    } else if (/className/i.test(p)) {
      console.warn('You can use "class" instead of "className".');
    } else if (typeof props[p] !== "undefined") {
      element.setAttribute(p, props[p]);
    }
  }
  const escape = ![
    "noscript",
    "script",
    "style",
  ].includes(tagNameOrComponent);
  appendChildren(element, children, escape);
  if (ref) ref(element);
  return element;
};
const _state = new Map();
const initGlobalVar = () => {
  const isSSR = detectSSR() === true ? true : undefined;
  const location = {
    pathname: "/",
  };
  const document = isSSR ? documentSSR() : window.document;
  globalThis._nano = {
    isSSR,
    location,
    document,
    customElements: new Map(),
  };
};
initGlobalVar();
class Component {
  props;
  id;
  _elements = [];
  _skipUnmount = false;
  _hasUnmounted = false;
  constructor(props) {
    this.props = props || {};
    this.id = this._getHash();
  }
  static get isClass() {
    return true;
  }
  get isClass() {
    return true;
  }
  setState(state, shouldUpdate = false) {
    const isObject = typeof state === "object" && state !== null;
    if (isObject && this.state !== undefined) {
      this.state = {
        ...this.state,
        ...state,
      };
    } else this.state = state;
    if (shouldUpdate) this.update();
  }
  set state(state) {
    _state.set(this.id, state);
  }
  get state() {
    return _state.get(this.id);
  }
  set initState(state) {
    if (this.state === undefined) this.state = state;
  }
  get elements() {
    return this._elements || [];
  }
  set elements(elements) {
    if (!Array.isArray(elements)) {
      elements = [
        elements,
      ];
    }
    elements.forEach((element) => {
      this._elements.push(element);
    });
  }
  _addNodeRemoveListener() {
    if (/^[^{]+{\s+}$/gm.test(this.didUnmount.toString())) return;
    onNodeRemove(this.elements[0], () => {
      if (!this._skipUnmount) this._didUnmount();
    });
  }
  _didMount() {
    this._addNodeRemoveListener();
    this.didMount();
  }
  _didUnmount() {
    if (this._hasUnmounted) return;
    this.didUnmount();
    this._hasUnmounted = true;
  }
  willMount() {
  }
  didMount() {
  }
  didUnmount() {
  }
  render(_update) {
  }
  update(update) {
    this._skipUnmount = true;
    const oldElements = [
      ...this.elements,
    ];
    this._elements = [];
    let el = this.render(update);
    el = _render(el);
    this.elements = el;
    const parent = oldElements[0].parentElement;
    if (!parent) {
      console.warn("Component needs a parent element to get updated!");
    }
    this.elements.forEach((child) => {
      if (parent) parent.insertBefore(child, oldElements[0]);
    });
    oldElements.forEach((child) => {
      child.remove();
      child = null;
    });
    this._addNodeRemoveListener();
    tick(() => {
      this._skipUnmount = false;
      if (!this.elements[0].isConnected) this._didUnmount();
    });
  }
  _getHash() {
  }
}
const Fragment = (props) => {
  return props.children;
};
const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_PROP_SET = 5;
const MODE_PROP_APPEND = 6;
const CHILD_APPEND = 0;
const evaluate = (h, built, fields, args) => {
  let tmp;
  built[0] = 0;
  for (let i = 1; i < built.length; i++) {
    const type = built[i++];
    const value = built[i]
      ? (built[0] |= type ? 1 : 2, fields[built[i++]])
      : built[++i];
    if (type === 3) {
      args[0] = value;
    } else if (type === 4) {
      args[1] = Object.assign(args[1] || {}, value);
    } else if (type === 5) {
      (args[1] = args[1] || {})[built[++i]] = value;
    } else if (type === 6) {
      args[1][built[++i]] += `${value}`;
    } else if (type) {
      tmp = h.apply(
        value,
        evaluate(h, value, fields, [
          "",
          null,
        ]),
      );
      args.push(tmp);
      if (value[0]) {
        built[0] |= 2;
      } else {
        built[i - 2] = CHILD_APPEND;
        built[i] = tmp;
      }
    } else {
      args.push(value);
    }
  }
  return args;
};
const build = function (statics, ...rest) {
  let mode = 1;
  let buffer = "";
  let quote = "";
  let current = [
    0,
  ];
  let __char;
  let propName;
  const commit = (field) => {
    if (
      mode === 1 &&
      (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))
    ) {
      {
        current.push(0, field, buffer);
      }
    } else if (mode === 3 && (field || buffer)) {
      {
        current.push(3, field, buffer);
      }
      mode = MODE_WHITESPACE;
    } else if (mode === 2 && buffer === "..." && field) {
      {
        current.push(4, field, 0);
      }
    } else if (mode === 2 && buffer && !field) {
      {
        current.push(5, 0, true, buffer);
      }
    } else if (mode >= 5) {
      {
        if (buffer || !field && mode === 5) {
          current.push(mode, 0, buffer, propName);
          mode = MODE_PROP_APPEND;
        }
        if (field) {
          current.push(mode, field, 0, propName);
          mode = MODE_PROP_APPEND;
        }
      }
    }
    buffer = "";
  };
  for (let i = 0; i < statics.length; i++) {
    if (i) {
      if (mode === 1) {
        commit();
      }
      commit(i);
    }
    for (let j = 0; j < statics[i].length; j++) {
      __char = statics[i][j];
      if (mode === 1) {
        if (__char === "<") {
          commit();
          {
            current = [
              current,
            ];
          }
          mode = MODE_TAGNAME;
        } else {
          buffer += __char;
        }
      } else if (mode === 4) {
        if (buffer === "--" && __char === ">") {
          mode = MODE_TEXT;
          buffer = "";
        } else {
          buffer = __char + buffer[0];
        }
      } else if (quote) {
        if (__char === quote) {
          quote = "";
        } else {
          buffer += __char;
        }
      } else if (__char === '"' || __char === "'") {
        quote = __char;
      } else if (__char === ">") {
        commit();
        mode = MODE_TEXT;
      } else if (!mode) {
      } else if (__char === "=") {
        mode = MODE_PROP_SET;
        propName = buffer;
        buffer = "";
      } else if (__char === "/" && (mode < 5 || statics[i][j + 1] === ">")) {
        commit();
        if (mode === 3) {
          current = current[0];
        }
        mode = current;
        {
          (current = current[0]).push(2, 0, mode);
        }
        mode = MODE_SLASH;
      } else if (
        __char === " " || __char === "\t" || __char === "\n" || __char === "\r"
      ) {
        commit();
        mode = MODE_WHITESPACE;
      } else {
        buffer += __char;
      }
      if (mode === 3 && buffer === "!--") {
        mode = MODE_COMMENT;
        current = current[0];
      }
    }
  }
  commit();
  return current;
};
const CACHES = new Map();
const regular = function (statics) {
  let tmp = CACHES.get(this);
  if (!tmp) {
    tmp = new Map();
    CACHES.set(this, tmp);
  }
  tmp = evaluate(
    this,
    tmp.get(statics) || (tmp.set(statics, tmp = build(statics)), tmp),
    arguments,
    [],
  );
  return tmp.length > 1 ? tmp : tmp[0];
};
const __default = false ? build : regular;
__default.bind(h);
class Counter extends Component {
  value = 0;
  changeValue(newValue) {
    this.value += newValue;
    this.update();
  }
  render() {
    return h(
      Fragment,
      null,
      h("div", null, "Counter: ", this.value),
      h("button", {
        onClick: () => this.changeValue(1),
      }, "Increment"),
      h("button", {
        onClick: () => this.changeValue(-1),
      }, "Decrement"),
    );
  }
}
render(h(Counter, null), document.body);
