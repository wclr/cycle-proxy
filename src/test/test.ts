import * as test from 'tape'
import './rx'
import './rxjs'
import './xstream'
import './most'

let anyTest = <any>test
anyTest.onFinish(() => process.exit(0))