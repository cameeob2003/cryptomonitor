<template>
  <div class="container">
    <div class="row mt-4 mb-3">
      <div class="col">
        <img id="logo" class="mx-auto d-block" src="~@/assets/logo.png" alt="electron-vue">
      </div>
    </div>
    <div class="row">
      <div class="col text-muted">
        <p class="text-center">Last data update: <b><timeago v-if="time !== ''" :since="time" :auto-update="1"></timeago></b></p>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col">
        <div class="form-inline">
          <div class="form-group">
            <select class="form-control mr-sm-3" id="selectedCurrency" v-model="selectedCurrency">
              <option disabled value="">Select a Currency</option>
              <option v-for="currency in currencies" v-bind:value="currency.id">{{ currency.name }} ({{ currency.symbol }})</option>
            </select>
          </div>
          <button type="submit" class="btn btn-default" v-on:click="addCurrency()">Add</button>
        </div>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col">
          <table class="table table-striped table-dark">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Symbol</th>
                <th scope="col">Rank</th>
                <th scope="col">Market Cap</th>
                <th scope="col">Change% (24h)</th>
                <th scope="col">Price BTC</th>
                <th scope="col">Price USD</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="currency in currencies" v-if="currency.isListed">
                <th scope="row">{{ currency.name }}</th>
                <td>{{ currency.symbol }}</td>
                <td>{{ currency.rank }}</td>
                <td>{{ format(currency.market_cap_usd) }}</td>
                <td v-if="currency.percent_change_24h >= 0" class="text-success">{{ currency.percent_change_24h }}%</td>
                <td v-if="currency.percent_change_24h < 0" class="text-danger">{{ currency.percent_change_24h }}%</td>
                <td>{{ currency. price_btc }}</td>
                <td>{{ format(currency.price_usd, 2) }}</td>
                <td><button class="btn btn-danger btn-sm" v-on:click="removeCurrency(currency.id)">X</button></td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  </div>
</template>

<script>
  let _ = require('underscore')
  let axios = require('axios')
  export default {
    name: 'Dashboard',
    data: function () {
      return {
        selectedCurrency: '',
        time: '',
        currencies: [],
        options: [],
        error: ''
      }
    },
    mounted: function () {
      // load the initial set of data we will be working with
      this.refreshAvailableCurrencies()

      // set an interval so that we update the data every 15 seconds (4x a minute)
      setInterval(function () { this.refreshAvailableCurrencies() }.bind(this), 15000)
    },
    methods: {
      refreshAvailableCurrencies: function () {
        axios.get('https://api.coinmarketcap.com/v1/ticker/?limit=0')
          .then((response) => {
            if (!this.currencies.length) {
              this.currencies = _.reduce(response.data, (result, currency) => {
                currency.isListed = false
                result.push(currency)
                return result
              }, [])
            } else {
              this.currencies = _.reduce(response.data, (result, currency) => {
                currency.isListed = this.isListed(currency.id)
                result.push(currency)
                return result
              }, [])
            }
            this.time = new Date().toISOString()
          })
          .catch(() => { this.error = 'Unable to fetch currency list.' })
      },
      isListed: function (currencyId) {
        return _.reduce(this.currencies, (result, currency) => {
          if (currency.id === currencyId) { return currency.isListed }
          return result
        }, false)
      },
      setListed: function (currencyId, boolean = false) {
        this.currencies = _.reduce(this.currencies, (result, currency) => {
          if (currency.id === currencyId) { currency.isListed = boolean }
          result.push(currency)
          return result
        }, [])
      },
      addCurrency: function () {
        this.setListed(this.selectedCurrency, true)
      },
      removeCurrency: function (currencyId) {
        this.setListed(currencyId, false)
      },
      format: function (amount, fraction = 0) {
        let formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: fraction
          // the default value for minimumFractionDigits depends on the currency
          // and is usually already 2
        })
        return formatter.format(amount)
      }
    }
  }
</script>

<style></style>
