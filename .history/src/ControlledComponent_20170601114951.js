// input, select, textarea, datalist这几个元素都会包装成受控组件或非受控组件 **受控组件**
// 是指定指定了value或checked 并绑定了事件的元素 **非受控组件** 是指定指定了value或checked，
// 但没有绑定事件，也没有使用readOnly, disabled来限制状态变化的元素
// 这时框架会弹出为它绑定事件，以重置用户的输入，确保它的value或checked值不被改变 但如果用户使用了defaultValue,
// defaultChecked，那么它不做任何转换
function getDOMOptionValue(node) {
    if (node.hasAttribute && node.hasAttribute('value')) {
        return node.getAttribute('value')
    }
    var attr = node.getAttributeNode('value')
    if (attr && attr.specified) {
        return attr.value
    }
    return node.innerHTML.trim()
}

function getOptionValue(option, props) {
    if (!props) {
        return getDOMOptionValue(option)
    }
    return props.value === undefined ? props.children[0].text : props.value
}

function isDefined(a) {
    return !(a === null || a === void 666)
}
export function postUpdateSelectedOptions(vnode) {
    var props = vnode.props,
        multiple = !!props.multiple,
        value = isDefined(props.value) ?
        props.value :
        isDefined(props.defaultValue) ?
        props.defaultValue :
        multiple ? [] :
        '',
        options = [];
    collectOptions(vnode, props, options)
    if (multiple) {
        updateOptionsMore(options, options.length, value)
    } else {
        updateOptionsOne(options, options.length, value)
    }

}

function collectOptions(vnode, props, ret) {
    var arr = props.children
    for (var i = 0, n = arr.length; i < n; i++) {
        var el = arr[i]
        if (el.type === 'option') {
            ret.push(el)
        } else if (el.type === 'optgroup') {
            collectOptions(el, el.props, ret)
        }
    }
}

function updateOptionsOne(vnode, options, n, propValue) {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    var selectedValue = '' + propValue;
    for (let i = 0; i < n; i++) {
        let option = options[i]
        let value = getOptionValue(option, option.props)
        if (value === selectedValue) {
            setDomSelected(option, true)
            return
        }
    }
    if (n) {
        setDomSelected(options[0], true)
    }

}

function updateOptionsMore(options, n, propValue) {

    var selectedValue = {}
    try {
        for (let i = 0; i < propValue.length; i++) {
            selectedValue['&' + propValue[i]] = true
        }
    } catch (e) {
        /* istanbul ignore next */
        console.warn('<select multiple="true"> 的value应该对应一个字符串数组')
    }
    for (let i = 0; i < n; i++) {
        let option = options[i]
        let value = getOptionValue(option, option.props)
        let selected = selectedValue.hasOwnProperty('&' + value)
        setDomSelected(option, selected)

    }
}

function setDomSelected(option, selected) {
    var dom = option._hostNode || option
    dom.selected = selected
}

//react的单向流动是由生命周期钩子的setState选择性调用（不是所有钩子都能用setState）,受控组件，事务机制

function stopUserInput(e) {
    var target = e.target
    var name = e.type === 'textarea' ?
        'innerHTML' :
        'value'
    target[name] = target._lastValue
}

function stopUserClick(e) {
    e.preventDefault()
}

function stopUserChange(e) {
    var target = e.target
    var value = target._lastValue
    var options = target.options
    if (target.multiple) {
        updateOptionsMore(options, options.length, value)
    } else {
        updateOptionsOne(options, options.length, value)
    }
}
export function processFormElement(vnode, dom, props) {

    var domType = dom.type


    if (/text|password|number|date|time|color|month/.test(domType)) {
        if ('value' in props && !hasOtherControllProperty(props, textMap)) {
            console.warn(`你为${domType}元素指定了value属性，但是没有提供另外的${Object.keys(textMap)}
           等用于控制value变化的属性，那么它是一个非受控组件，用户无法通过输入改变元素的value值`)
            dom.oninput = stopUserInput
        }
    } else if (/checkbox|radio/.test(domType)) {
        if ('checked' in props && !hasOtherControllProperty(props, checkedMap)) {
            console.warn(`你为${domType}元素指定了value属性，但是没有提供另外的${Object.keys(checkedMap)}
           等用于控制value变化的属性，那么它是一个非受控组件，用户无法通过输入改变元素的value值`)
            dom.onclick = stopUserClick
        }
    } else if (/select/.test(domType)) {
        if ('value' in props && !hasOtherControllProperty(props, selectMap)) {
            console.warn(`你为${domType}元素指定了value属性，但是没有提供另外的${Object.keys(textMap)}
           等用于控制value变化的属性，那么它是一个非受控组件，用户无法通过输入改变元素的value值`)
            dom.onchange = stopUserChange
        }
        postUpdateSelectedOptions(vnode)
    }
}
var duplexMap = {
    color: 1,
    date: 1,
    datetime: 1,
    'datetime-local': 1,
    email: 1,
    month: 1,
    number: 1,
    password: 1,
    range: 1,
    search: 1,
    tel: 1,
    text: 1,
    time: 1,
    url: 1,
    week: 1,
    textarea: 1,
    checkbox: 2,
    radio: 2,
    'select-one': 3,
    'select-multiple': 3
}

var textMap = {
    onChange: 1,
    onInput: 1,
    readyOnly: 1,
    disabled: 1
}
var checkedMap = {
    onChange: 1,
    onClick: 1,
    readyOnly: 1,
    disabled: 1
}
var duplexData = {
    1: ['value', {
        onChange: 1,
        onInput: 1,
        readyOnly: 1,
        disabled: 1
    }],
    2: ['checked', {
        onChange: 1,
        onClick: 1,
        readyOnly: 1,
        disabled: 1
    }],
    3: ['value',{
        
    }]
}


function hasOtherControllProperty(props, map) {
    for (var i in props) {
        if (map[i]) {
            return true
        }
    }
    return false
}