// 相当于生成一个私有变量，比较不容易被访问到
const RENDER_TO_DOM = Symbol('render to dom')

class ElementWrapper {
    constructor (type) {
        this.root = document.createElement(type)
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild (component) {
        let range = document.createRange()
        // 注意这个位置，因为这里是appendChild操作，即插入最后
        // 所以range不是[0,length]而是[length,length]
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        component[RENDER_TO_DOM](range)
    }
    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export class Component {
    constructor () {
        this.props = Object.create(null)
        this.children = []
        this._root = null
    }
    setAttribute (name, value) {
        this.props[name] = value
    }
    appendChild (component) {
        this.children.push(component)
    }
    [RENDER_TO_DOM] (range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }
}

export function createElement (type, attrs, ...children) {
    let e
    if (typeof type === 'string') {
        // ElementWrapper里面有setAttribute,appendChild、root
        e = new ElementWrapper(type)
    } else {
        // 这是实例化的组件，继承了Component
        // 它里面也有setAttribute,appendChild、root
        e = new type()
    }
    for (let key in attrs) {
        // 经过ElementWrapper和Component的包装
        // 已经抹平了常规的html标签'div'，自定义组件<MyComp></MyComp>的差异
        // 此时他们都有setAttribute
        e.setAttribute(key, attrs[key])
    }
    let insertChildren = (children) => {
        for (const child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            } 
            if (Array.isArray(child)){
                insertChildren(child)
            } else {
                e.appendChild(child)
            }
        }
    }
    insertChildren(children)
    return e
}

export function render (comp, parentElement) {
    /**
     * 之前是操作真实dom，渲染完就没后续了
     * 如果要重新渲染页面，我们不可能再一个个找到dom元素修改
     */
    // 为了能够重新渲染，使用range
    // 但是这种方式每次会渲染整个树，后期依然要改造
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    comp[RENDER_TO_DOM](range)
}