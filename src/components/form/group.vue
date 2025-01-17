<template>
  <div :class="classGroup" @mouseenter="mouseenter" @mouseleave="mouseleave">
    <div
      v-if="description"
      class="f-form-control-description"
      v-text="$t(description)"
    />
    <div :class="classGroupInner">
      <label v-if="prepend" :for="id" class="f-form-control-prepend">
        <f-svg :name="prepend" fw />
      </label>
      <f-form-item
        ref="item"
        v-bind="attrs"
        v-on="$listeners"
        @focus="focus"
        @blur="blur"
        @input="input"
      >
        <slot :id="id" />
      </f-form-item>
      <slot :id="id" name="label" :classLabel="classLabel" :label="$t(label)">
        <label v-if="label" :class="classLabel" :for="id" v-text="$t(label)" />
      </slot>
      <f-placeholder v-if="showPlaceholder" v-bind="attrs" />
    </div>
    <f-tooltip-error
      v-if="showErrorTooltip"
      :show.sync="showErrorTooltipFlag"
      :target="() => $refs.item && $refs.item.$el"
      under-sticky
    >
      <f-svg name="warning" size="md" />
      {{ error }}
    </f-tooltip-error>
    <transition name="f-slide-fade">
      <div v-if="showError" class="f-error">{{ error }}</div>
    </transition>
  </div>
</template>

<script>
import { mapState } from '@/utils/store'
import { isExist } from '@/utils/typeof'
import id from '@/mixins/id'
import isMounted from '@/mixins/is_mounted'

export default {
  mixins: [id, isMounted],
  inheritAttrs: false,
  props: {
    description: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default() {
        return this.$attrs.component === 'checkbox' ? '' : this.name
      },
    },
    labelClass: {
      type: String,
      default: 'f-control-label-p',
    },
    tooltip: {
      type: Boolean,
      default: false,
    },
    hideError: {
      type: Boolean,
      default: false,
    },
    prepend: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      focused: false,
      hover: false,
      value: null,
      showErrorTooltipFlag: false,
    }
  },
  computed: {
    ...mapState(['isSubmit']),
    validation() {
      if (!this.isMounted) return
      return this.$refs.item.$children[0].$refs.validation
    },
    touched() {
      if (!this.isMounted) return
      return this.validation.flags.touched
    },
    error() {
      if (!this.isMounted) return
      return this.validation.errors[0]
    },
    attrs() {
      return {
        ...this.$attrs,
        id: this.id,
        name: `f-${this.name}`,
      }
    },
    classGroup() {
      return [
        'f-form-group',
        {
          'f-has-error': this.hasError,
        },
      ]
    },
    classGroupInner() {
      return [
        'f-form-group-inner',
        {
          'f-readonly': this.$attrs.readonly,
          'f-disabled': this.$attrs.disabled,
          ['f-form-group-inner-' + this.$attrs.component]: this.$attrs
            .component,
        },
      ]
    },
    classLabel() {
      return [
        'f-control-label',
        this.labelClass,
        {
          'f-control-label-active':
            (isExist(this.value) && this.value !== '') || this.focused,
        },
        { 'f-control-label-hover': this.hover },
        { 'f-control-label-focused': this.focused },
      ]
    },
    hasError() {
      return this.error && (this.touched || this.isSubmit)
    },
    showError() {
      let showError = !this.tooltip && this.hasError && this.focused
      this.$emit('show-error', showError, this.error)
      return showError && !this.hideError
    },
    showErrorTooltip() {
      return this.tooltip && this.hasError && this.focused
    },
    showPlaceholder() {
      return !this.labelClass && this.id
    },
  },
  watch: {
    showErrorTooltip: 'watchShowErrorTooltip',
  },
  methods: {
    focus() {
      this.focused = true
    },
    blur() {
      this.focused = false
    },
    input(value) {
      this.value = value
    },
    mouseenter() {
      this.hover = true
    },
    mouseleave() {
      this.hover = false
    },
    watchShowErrorTooltip(value) {
      this.showErrorTooltipFlag = value
    },
  },
}
</script>
