<template>
  <div class="card">
    <div class="card-body">
      <p class="card-text text-center">Difference</p>
      <h5 class="card-title text-center">{{ format(currentDiff, 2) }}</h5>
      <p class="card-text text-muted text-center"><small>The percentage that your current account value differs from your highest seen account value</small></p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'account-value-diff',
    props: ['currentAccountValue', 'bus'],
    data: function () {
      return {
        currentDiff: 0
      }
    },
    mounted: function () {
      this.bus.$on('highest-account-value-update', function (value) {
        this.currentDiff = ((this.currentAccountValue - value) / value)
      }.bind(this))
    },
    methods: {
      format: function (amount, fraction = 0) {
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: fraction
        }).format(amount)
      }
    }
  }
</script>
