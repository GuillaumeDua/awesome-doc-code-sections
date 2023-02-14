const feature_value_storage = (state) => ({

    op_1: () => console.log('op_1'),
    get value() {
        return state.details.value
    },
    set value(arg) {
        state.details.value = arg
        state.NotifyPropertyChanged({ property_name: 'value' })
    }
})
const feature_NotifyPropertyChangedInterface = (state, parameters) => {

    return {
        _NotifyPropertyChangedInterface_handlers: new Map,
        _constructor(){

            if (!parameters)
                return
            if (!(parameters instanceof Array))
                throw new Error('NotifyPropertyChangedInterface.constructor: invalid argument')

            parameters.forEach((value, index) => {
                if (!(value instanceof Array) || value.length !== 2)
                    throw new Error(`NotifyPropertyChangedInterface.constructor: invalid argument (at index ${index})`)
                this.add_OnPropertyChangeHandler({ property_name: value[0], handler: value[1] })
            })
        },
        add_OnPropertyChangeHandler({property_name, handler}) {
            if (!(handler instanceof Function))
                throw new Error('NotifyPropertyChangedInterface.add_OnPropertyChangeHandler: invalid argument')
            this._NotifyPropertyChangedInterface_handlers.set(property_name, handler)
        },
        remove_OnPropertyChangeHandler({property_name}) {
            this._NotifyPropertyChangedInterface_handlers.delete(property_name)
        },
        NotifyPropertyChanged({property_name}){
            const handler = this._NotifyPropertyChangedInterface_handlers.get(property_name)
            if (handler)
                handler({
                    property_name: property_name,
                    value: this[property_name]
                })
        }
    }
}

class composition_factory {

    static is_class_definition(value){
        return value.prototype
            && value.prototype.constructor.toString
            && value.prototype.constructor.toString().substring(0, 5) === 'class'
    }
    static is_class_value(value){
        return value.constructor.toString
            && value.constructor.toString().substring(0, 5) === 'class'
    }

    static make_prototype = ({ state, features }) => {

        if (!state
         || !(features instanceof Array)
         || features.filter(feature => !feature).length)
            throw new Error('composition_factory.make_prototype: invalid argument')

        state = composition_factory.is_class_definition(state)
            ? new state
            : state // structuredClone(state)

        features
        .map(feature => {
            const feature_constructor = composition_factory.is_class_definition(feature)
                ? (arg) => { return new feature(arg) }
                : feature
            if (!(feature_constructor instanceof Function))
                throw new Error(`composition_factory.make_prototype: invalid feature [${feature}]`)

            let feature_value = feature_constructor(state)
            return {
                ...Object.getOwnPropertyDescriptors(feature_value),
                ...Object.getOwnPropertyDescriptors(Object.getPrototypeOf(feature_value))
                // ...Object.getOwnPropertyDescriptors(Reflect.getPrototypeOf(Object.getPrototypeOf(b)))
            }
        })
        .forEach(propertyDescriptors => {
        // // TODO: constructor ?
        //     console.log(propertyDescriptors)
             Object.defineProperties(state, propertyDescriptors)
        //     if (propertyDescriptors._constructor) {
        //         state._constructor()
        //         delete state._constructor
        //     }
        })
        
        return state
    }
    static make_composition = ({ state, features, extends_type = undefined }) => {
        return extends_type
            ? class extends extends_type {
                constructor(){
                    super()
                    const prototype = composition_factory.make_prototype({ state: state, features: features })
                    Object.defineProperties(this, Object.getOwnPropertyDescriptors(prototype))
                }
            }
            : class {
                constructor(){
                    const prototype = composition_factory.make_prototype({ state: state, features: features })
                    Object.defineProperties(this, Object.getOwnPropertyDescriptors(prototype))
                }
            }
    }
}

// ---

class NotifyPropertyChangedInterface {

    _handlers = new Map

    constructor(args){
        console.debug(`NotifyPropertyChangedInterface.constructor with`, args)

        if (!args)
            return
        if (!(args instanceof Array))
            throw new Error('NotifyPropertyChangedInterface.constructor: invalid argument')

        args.forEach((value, index) => {
            if (!(value instanceof Array) || value.length !== 2)
                throw new Error(`NotifyPropertyChangedInterface.constructor: invalid argument (at index ${index})`)
            this.add_OnPropertyChangeHandler(value[0], value[1])
        })
    }

    add_OnPropertyChangeHandler = ({property_name, handler}) => {
        if (!(handler instanceof Function))
            throw new Error('NotifyPropertyChangedInterface.add_OnPropertyChangeHandler: invalid argument')
        this._handlers.set(property_name, handler)
    }
    remove_OnPropertyChangeHandler = ({property_name}) => {
        this._handlers.delete(property_name)
    }

    NotifyPropertyChanged = ({property_name}) => {
        const handler = this._handlers.get(property_name)
        console.log(this)
        if (handler)
            handler(property_name)
    }
}

// ---

class state {
    details = { value: 42 }
}

class A{ 
    a = 1
    get a_value(){ return this.a }
}
class B extends A { 
    b = 1
    get b_value(){ return this.b }
}
class C extends B { 
    c = 1
    get c_value(){ return this.c }
}

get_complete_descriptor = (value) => {
// handles inheritance

    if (!Boolean(value instanceof Object))
        throw new Error('get_complete_descriptor: invalid argument')

    let result = Object.getOwnPropertyDescriptors(value)

    const add_parents_prototype = (proto) => {
        result = {
            ...result,
            ...Object.getOwnPropertyDescriptors(proto)
        }
        if (proto = Object.getPrototypeOf(proto))
            add_parents_prototype(proto)
    }
    add_parents_prototype(Object.getPrototypeOf(value))

    return result
}

const type_1 = composition_factory.make_composition({
    state: state,
    features: [
        feature_value_storage,
        // NotifyPropertyChangedInterface
        (state) => {
            let value = new NotifyPropertyChangedInterface
            value.add_OnPropertyChangeHandler({ property_name: 'value', handler: (arg) => console.log('value changed to:', state[arg]) })
            return value
        }
    ],
    extends_type: HTMLElement
})
customElements.define('type-1', type_1)

