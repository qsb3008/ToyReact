import { createElement, render, Component } from './toyReact'

class MyComponent extends Component {
    render() {
        return <div>
            i am component{this.props.name}!
            {
                this.children
            }
        </div>
    }
}

render(<MyComponent className="a" name="b">
    222
    <div>12</div>
    <div></div>
</MyComponent>, document.body)
