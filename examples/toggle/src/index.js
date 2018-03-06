import React, { Component } from "react";
import ReactDOM from "react-dom";
import { graphql, compose, ApolloProvider } from 'react-apollo'
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link"
import { HttpLink } from "apollo-link-http";
import { withClientState } from 'apollo-link-state'
import gql from 'graphql-tag'
import {createCacheLink} from 'apollo-link-cache'

const cache = new InMemoryCache()

const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
      setLoggedIn: (_, { isLoggedIn }, { cache }) => {
        const data = {
          isLoggedIn
        };
        cache.writeData({ data });
        return null
      },
    }
  },
  defaults: {
    isLoggedIn: 'No'
  }
});

const cacheLink = createCacheLink({
  resolvers: {
    isLoggedIn: (_, __, { cache }) => {
      const {isLoggedIn} = cache.readQuery({query: gql`
        {
          isLoggedIn @client
        }
      `})
      return isLoggedIn
    }
  }
})

const client = new ApolloClient({
  cache,
  link: ApolloLink.from([
    cacheLink,
    stateLink,
    new HttpLink()
  ]),
});

class App extends Component {
  toggleLoggedIn = () => {
    const { isLoggedIn, mutate } = this.props
    mutate({variables: { isLoggedIn: isLoggedIn === 'Yes'? 'No' : 'Yes'}})
  }
  render() {
    const { isLoggedIn } = this.props
    console.log(this.props)
    return (
      <div>
        <button onClick={this.toggleLoggedIn}>{isLoggedIn}</button>
      </div>
    )
  }
}

const isLoggedInQuery = gql`
  {
    isLoggedIn @cache
  }
`

const setLoggedInMutation = gql`
  mutation setLoggedIn($isLoggedIn: String) {
   setLoggedIn(isLoggedIn: $isLoggedIn) @client
  }
`

const AppContainer = compose(
  graphql(isLoggedInQuery, {
    props: ({ data: { isLoggedIn } }) => ({ isLoggedIn })
  }),
  graphql(setLoggedInMutation)
)(App);

ReactDOM.render(
  <ApolloProvider client={client}>
    <AppContainer />
  </ApolloProvider>, document.getElementById("root")
);
