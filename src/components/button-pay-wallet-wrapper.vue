<template>
  <button-pay-wallet-inner v-if="show" v-bind="$attrs" />
</template>

<script>
import { mapState } from '@/utils/store'
import ButtonPayWalletInner from '@/components/button-pay-wallet-inner'

export default {
  components: {
    ButtonPayWalletInner,
  },
  computed: {
    ...mapState(['ready']),
    ...mapState('params', ['token']),
    ...mapState('options', ['methods_disabled']),
    show() {
      return (
        !this.methods_disabled.includes('wallets') &&
        (this.token ? this.ready : true)
      )
    },
  },
}
</script>
