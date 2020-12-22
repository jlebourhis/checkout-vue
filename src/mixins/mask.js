import mask from '@/utils/masker'

const config = {}

export default {
  props: {
    mask: {
      type: [String, Array],
      default: '',
    },
    masked: {
      type: Boolean,
      default: false,
    },
    format: {
      type: Function,
      default: value => value,
    },
  },
  data() {
    return {
      innerMask: config[this.mask] || this.mask,
    }
  },
  methods: {
    watchInnerValue(newValue) {
      let value = mask(this.format(newValue), this.innerMask, true)
      if (newValue !== value) {
        this.innerValue = value
        this.$refs.input.localValue = value
      } else {
        this.$emit('input', mask(newValue, this.innerMask, this.masked))
      }
    },
    watchValue(newValue) {
      this.innerValue = mask(this.format(newValue), this.innerMask, true)
    },
  },
}
