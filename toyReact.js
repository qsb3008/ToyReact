// 相当于生成一个私有变量，比较不容易被访问到
const RENDER_TO_DOM = Symbol('render to dom')

class ElementWrapper {
    constructor (type) {
        this.root = document.createElement(type)
    }
    setAttribute (name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
        } else {
            if (name === 'className') {
                this.root.setAttribute('class', value)
            } else {
                this.root.setAttribute(name, value)
            }
        }
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
        this.root = document.createTextNode(String(content))
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
        this._range = null
    }
    setAttribute (name, value) {
        this.props[name] = value
    }
    appendChild (component) {
        this.children.push(component)
    }
    [RENDER_TO_DOM] (range) {
        // 因为后面要重新绘制，所以要先存起来
        this._range = range
        // this.render, 是我们自动组件里面的 render () { return <jsx></jsx> }
        this.render()[RENDER_TO_DOM](range)
    }
    rerender () {
        this._range.deleteContents();
        this[RENDER_TO_DOM](this._range)
    }
    setState (newState) {
        if (this.state === null || typeof  this.state !== 'object') {
            this.state = newState
            this.rerender()
            return
        }
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (oldState[p] === null || typeof oldState[p]  !== 'object') {
                    oldState[p] = newState[p]
                } else {
                    merge(oldState[p], newState[p])
                }
            }
        }
        merge(this.state, newState)
        this.rerender()
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
            if (typeof child === 'string' || typeof child === 'number') {
                child = new TextWrapper(child)
            } 
            if (child === null) {
                continue
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