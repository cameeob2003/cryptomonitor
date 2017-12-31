<template>
  <div class="card">
    <div class="card-body">
      <p class="card-text text-center">Current Value</p>
      <h5 class="card-title text-center">{{ format(currentValue, 2) }}</h5>
      <p class="card-text text-muted text-center"><small>This is the current estimated value of your account</small></p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'current-account-value',
    props: ['currentValue'],
    data: function () {
      return {}
    },
    methods: {
      format: function (amount, fraction = 0) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: fraction
        }).format(amount)
      }
    }
  }
</script>
