import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link"
import { HttpLink } from "apollo-link-http";
import { withClientState } from 'apollo-link-state'
import {createCacheLink} from 'apollo-link-cache'
import {usersQuery, userFragment} from './queries'
import Toggles from './Toggles'
import UserList from './UserList'

const cache = new InMemoryCache()

const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
      toggleUser: (_, { index }, { cache }) => {
        const {users} = cache.readQuery({query: usersQuery})
        users[index].selected = !users[index].selected
        cache.writeData({ data: {users} });
        return null
      },
    }
  },
  defaults: {
    users: [
      {
        __typename: 'User',
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        selected: true
      },
      {
        __typename: 'User',
        id: 2,
        firstName: 'James',
        lastName: 'Watt',
        selected: false
      },
      {
        __typename: 'User',
        id: 3,
        firstName: 'Alan',
        lastName: 'Kay',
        selected: false
      }
    ]
  }
});

const cacheLink = createCacheLink({
  resolvers: {
    user: (_, {id}, {cache}) => {
      const user = cache.readFragment({
        id: `User:${id}`,
        fragment: userFragment
      })
      return user
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


function App() {
  return (
    <div>
        <Toggles />
        <UserList />
    </div>
  )
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>, document.getElementById("root")
);
