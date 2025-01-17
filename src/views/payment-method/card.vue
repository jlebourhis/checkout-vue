<template>
  <div>
    <template v-if="isBreakpointMd">
      <div>
        <f-info v-if="isOnlyCard" />
        <f-price v-else />
      </div>
      <f-button-pay-wallet position="center" />
      <f-icons
        v-if="isOnlyCard"
        class="f-mb-3"
        title="pay_with_card"
        :count="5"
        under-sticky
        position="center"
      />
    </template>
    <div class="f-card">
      <div class="f-card-shadow" />
      <div :class="classCardBg" />
      <div class="f-card-brand">
        <transition name="f-fade">
          <f-icon
            v-if="cardBrand"
            type="card_system/max"
            :name="cardBrand"
            class="f-card-brand-icon"
          />
        </transition>
      </div>
      <f-form-group
        ref="card_number"
        v-model="card_number"
        class="f-form-group-card f-form-group-card-number"
        name="card_number"
        placeholder="card_number_p"
        :rules="validCardNumber"
        :mask="maskCardNumber"
        :masked="false"
        :maxlength="23"
        :disabled="readonly"
        type="tel"
        inputmode="numeric"
        tooltip
        label-class
        autocomplete="cc-number"
        @input="inputCardNumber"
      >
        <template v-if="need_verify_code" #label="{ classLabel, label }">
          <label :class="classLabel">
            {{ label }} <f-svg name="lock-alt" size="lg" />
          </label>
        </template>
        <template v-else-if="isCards" #label="{ classLabel, label }">
          <template v-if="enableModal">
            <a
              href="#"
              :class="[classLabel, 'f-control-label-card-list']"
              @click.prevent="showModalCard = true"
            >
              {{ label }} <f-svg name="angle-down" size="lg" />
            </a>
          </template>
          <template v-else>
            <a
              ref="tooltip"
              href="#"
              :class="[classLabel, 'f-control-label-card-list']"
              tabindex="-1"
              @click.prevent="showTooltipCard = true"
              @blur="blurTooltipCard"
            >
              {{ label }}
              <f-svg ref="label" name="angle-down" size="lg" tabindex="0" />
            </a>
            <f-tooltip-card
              :show.sync="showTooltipCard"
              :target="() => $refs.label && $refs.label.$el"
              under-sticky
            >
              <f-card-list @input="setCardNumber" @add="addCardNumber" />
            </f-tooltip-card>
          </template>
        </template>
      </f-form-group>

      <f-form-group
        ref="expiry_date"
        v-model="expiry_date"
        class="f-form-group-card"
        name="expiry_date"
        placeholder="expiry_date_p"
        :rules="readonly ? '' : validExpiryDate"
        :mask="maskExpiryDate"
        :masked="true"
        :disabled="readonly"
        type="tel"
        inputmode="numeric"
        tooltip
        label-class
        autocomplete="cc-exp"
        :format="format"
        @input="inputExpiryDate"
      />
      <f-form-group
        ref="cvv2"
        v-model="cvv2"
        class="f-form-group-card"
        name="cvv2"
        placeholder="cvv2_p"
        :rules="need_verify_code ? '' : validCvv"
        type="tel"
        inputmode="numeric"
        :mask="maskCvv"
        :disabled="need_verify_code"
        :maxlength="digitsCvv"
        tooltip
        label-class
        autocomplete="cc-csc"
      >
        <template #label="{ classLabel, id, label }">
          <label :class="classLabel" :for="id">
            <span ref="label_cvv">{{ label }}</span>
          </label>

          <f-tooltip-default
            custom-class="f-tooltip-cvv"
            placement="top"
            :target="() => $refs.label_cvv"
            variant="secondary"
            under-sticky
          >
            <f-svg name="info-circle" size="md" />
            <span v-text="$t('cvv2_help', [digitsCvv])" />
          </f-tooltip-default>
        </template>
      </f-form-group>
    </div>
    <f-preloader :condition="showEmail" class="f-mb-3">
      <f-form-group
        v-model.trim="email"
        input-class="f-checkout-email"
        name="email"
        rules="required|email"
        autocomplete="email"
      />
    </f-preloader>
    <f-form-group
      v-if="isVerificationCode"
      v-model="code"
      name="verification_code"
      :rules="validCode"
      type="tel"
      :maxlength="4"
    />
    <f-form-group
      v-if="isVerificationAmount"
      v-model="code"
      name="verification_amount"
      :rules="validAmount"
      type="text"
    />
    <f-customer-fields />
    <f-fields />
    <f-subscription v-if="showSubscription" />
    <f-offer />
    <f-button-pay />
    <f-modal-base
      v-model="showModalCard"
      content-class="f-modal-content-card-list"
      header-class="f-p-0"
      body-class="f-modal-body-card-list"
      :return-focus="returnFocus"
    >
      <f-card-list @input="setCardNumber" @add="addCardNumber" />
    </f-modal-base>
  </div>
</template>

<script>
//  ['#### ### ### ###', ' #### ###### #####', '#### #### #### ####', '  ######## ##########']
import { errorHandler } from '@/utils/helpers'
import { mapState, mapStateGetSet } from '@/utils/store'
import FSubscription from '@/components/subscription'
import FCardList from '@/components/card-list'
import Resize from '@/mixins/resize'
import getCardBrand from '@/utils/card-brand'
import FIcons from '@/components/icons'
import timeout from '@/mixins/timeout'
import isMounted from '@/mixins/is_mounted'
import { isPhone, isMobileFirefox, isDesktop } from '@/utils/mobile'
import { createDate, formatMMYY } from '@/utils/date'

export default {
  components: {
    FSubscription,
    FCardList,
    FIcons,
  },
  mixins: [Resize, timeout, isMounted],
  data() {
    return {
      maskExpiryDate: '##/##',
      maskCardNumber: 'XXXX XXXX XXXX XXXX XXX',
      maskCvv: '####',
      showModalCard: false,
      showTooltipCard: false,
      wrapper: null,
      returnFocus: null,
      cardBrand: '',
    }
  },
  computed: {
    ...mapState([
      'read_only',
      'need_verify_code',
      'verification_type',
      'cards',
      'css_variable',
      'submited',
      'isOnlyCard',
      'ready',
    ]),
    ...mapState('options', {
      showEmail: 'email',
    }),
    ...mapState('params', ['token']),
    ...mapState('css_variable', ['card_bg_lighten']),
    ...mapStateGetSet('params', [
      'email',
      'cvv2',
      'expiry_date',
      'card_number',
      'code',
    ]),
    showSubscription() {
      return this.token ? this.ready : true
    },
    readonly() {
      return this.read_only || this.need_verify_code
    },
    validExpiryDate() {
      let minDate = this.store.state.validate_expdate
        ? formatMMYY(createDate())
        : '01/19'

      return `required|date_format:MM/yy|after:${minDate},true,MM/yy`
    },
    validCardNumber() {
      let needValidCard =
        !/\d{6}X/.test(this.card_number) &&
        (this.card_number.length === 16 ||
          this.card_number.length === 19 ||
          this.submited)

      return needValidCard ? 'required|ccard' : 'required'
    },
    validCvv() {
      return 'required|digits:' + this.digitsCvv
    },
    digitsCvv() {
      return this.card_number.match('^3(?:2|3|4|7)') ? 4 : 3
    },
    isCards() {
      return !!this.cards.length
    },
    validCode() {
      return /EURT/.test(this.code) ? 'required' : 'required|digits:4'
    },
    validAmount() {
      return {
        required: true,
        numrange: [0, 9999999.99],
        regex: '^\\d{1,7}([,.]\\d{1,2})?$',
      }
    },
    isVerificationAmount() {
      return this.need_verify_code && this.verification_type === 'amount'
    },
    isVerificationCode() {
      return this.need_verify_code && this.verification_type !== 'amount'
    },
    classCardBg() {
      return [
        'f-card-bg',
        {
          'f-card-img':
            this.css_variable.card_img &&
            !this.css_variable.card_gradient_custom,
          'f-card-gradient-custom':
            this.css_variable.card_gradient_custom &&
            !this.css_variable.card_img,
          'f-card-bg-lighten': this.card_bg_lighten,
        },
      ]
    },
    enableModal() {
      return isPhone || this.isWidthSm
    },
  },
  watch: {
    card_number(value) {
      this.cardBrand = getCardBrand(value)
      if (!value) return

      value = value.slice(0, 6)
      let card_bin = value.length === 6 ? value : value[0]

      this.store
        .sendRequest(
          'api.checkout.card_type_fee',
          'get',
          {
            token: this.token,
            card_bin,
          },
          { cached: true }
        )
        .then(this.cardTypeFeeSuccess)
        .catch(errorHandler)
    },
  },
  mounted() {
    this.wrapper = this.$parent.$parent
    this.wrapper.$on('scroll', this.scroll)
  },
  destroyed() {
    this.wrapper.$off('scroll', this.scroll)
  },
  methods: {
    cardTypeFeeSuccess() {},
    setCardNumber() {
      this.returnFocus = this.$refs.cvv2.$children[0].$children[0].$refs.input.$el
      this.hide()
    },
    addCardNumber() {
      this.returnFocus = this.$refs.card_number.$children[0].$children[0].$refs.input.$el
      this.hide()
    },
    hide() {
      this.showModalCard = false
      this.showTooltipCard = false
      // for focus after hiding the tooltip
      this.timeout(() => {
        this.returnFocus.focus()
      }, 100)
    },
    blurTooltipCard() {
      // TODO to volunteer the event setCardNumber addCardNumber
      this.timeout(() => {
        this.showTooltipCard = false
      }, 100)
    },
    inputCardNumber(value) {
      if (value.length !== 16 && value.length !== 19) return
      this.focus('card_number', value, 'expiry_date')
    },
    inputExpiryDate(value) {
      this.focus('expiry_date', value, 'cvv2')
    },
    focus(name, value, next) {
      if (!this.isMounted) return
      // wait for computed property validCardNumber
      this.$nextTick()
        .then(() =>
          this.$refs[name].$children[0].$children[0].$refs.validation.validate()
        )
        .then(({ valid }) => {
          if (!valid) return Promise.reject()
          return this.$nextTick()
        })
        .then(() => {
          this.$refs[next].$children[0].$children[0].$refs.input.$el.focus()
        })
        .catch(errorHandler)
    },
    scroll() {
      if (isMobileFirefox) return

      let activeElement = document.activeElement

      if (activeElement.tagName !== 'INPUT') return

      activeElement.blur()

      if (isDesktop) {
        let rectWrapper = this.wrapper.$el.getBoundingClientRect()
        let rectActiveElement = activeElement.getBoundingClientRect()

        if (rectActiveElement.top < rectWrapper.top) return
        if (rectActiveElement.bottom > rectWrapper.bottom) return
      }

      activeElement.focus()
    },
    format(value) {
      let [month, year] = value.split('/')

      if (year && year.length === 4) {
        year = year.slice(-2)
        value = `${month}/${year}`
      }

      return value
    },
  },
}
</script>
