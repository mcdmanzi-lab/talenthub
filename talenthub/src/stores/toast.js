import { reactive } from 'vue'

export const toast = reactive({
  visible: false,
  message: '',
  type: 'success',
  _timer: null,

  show(message, type = 'success') {
    this.message = message
    this.type = type
    this.visible = true
    clearTimeout(this._timer)
    this._timer = setTimeout(() => { this.visible = false }, 3500)
  },

  success(msg) { this.show(msg, 'success') },
  error(msg)   { this.show(msg, 'error') },
  info(msg)    { this.show(msg, 'info') }
})
