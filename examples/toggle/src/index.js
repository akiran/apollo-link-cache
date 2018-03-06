import React, { Component } from "react";
import ReactDOM from "react-dom";
import { graphql, compose, ApolloProvider } from 'react-apollo'
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link"
import { HttpLink } from "apollo-link-http";
import { withClientState } from 'apollo-link-state'
import gql from 'graphql-tag'
import {
  getFragmentQueryDocument,
} from 'apollo-utilities';
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
      setFirstName: (_, { index, firstName }, { cache }) => {
        const {users} = cache.readQuery({query: usersQuery})
        //console.log(users, index, 'users in setFirstName')
        users[index].firstName = firstName
        cache.writeData({ data: {users} });
        return null
      },
    }
  },
  defaults: {
    isLoggedIn: 'No',
    users: [
      {
        __typename: 'User',
        id: 1,
        firstName: 'Kiran',
        lastName: 'Kumar'
      },
      {
        __typename: 'User',
        id: 2,
        firstName: 'Kiran',
        lastName: 'Kumar'
      },
      {
        __typename: 'User',
        id: 3,
        firstName: 'Kiran',
        lastName: 'Kumar'
      }
    ]
  }
});

const cacheLink = createCacheLink({
  resolvers: {
    user: (_, {id}, {cache}) => {
      //console.log('came to cache resolvers', id)
      const user = cache.readFragment({
        id: `User:${id}`,
        fragment: userFragment
      })
      //console.log('user in cacheLink!!!!!', user)
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


class Toggle extends Component {
  toggleLoggedIn = (index) => {
    const { isLoggedIn, setLoggedInMutation } = this.props
    setLoggedInMutation({variables: {isLoggedIn: isLoggedIn === 'Yes' ? 'No' : 'Yes'}})
  }
  toggleUser = (index) => {
    const { users, mutate } = this.props
    mutate({variables: {index, firstName: users[index].firstName === 'Kiran'? 'John' : 'Kiran'}})
  }
  render() {
    const { isLoggedIn, users } = this.props
    //console.log(this.props)
    return (
      <div>
        <button onClick={this.toggleLoggedIn}>{isLoggedIn}</button>
        {users.map((user, index) => {
          return <button key={index} onClick={() => this.toggleUser(index)}>{user.firstName}</button>
        })}
      </div>
    )
  }
}

const isLoggedInQuery = gql`
  {
    isLoggedIn @client
  }
`
const usersQuery = gql`
  {
    users {
      id
      firstName
      lastName
    }
  }
`

const userFragment = gql`
  fragment userFragment on User {
    id
    firstName
    lastName
  }
`

const setLoggedInMutation = gql`
  mutation setLoggedIn($isLoggedIn: String) {
   setLoggedIn(isLoggedIn: $isLoggedIn) @client
  }
`

const setFirstNameMutation = gql`
  mutation setFirstName($index: Int, $firstName: String) {
   setFirstName(index: $index, firstName: $firstName) @client
  }
`

class User extends React.Component {
  render() {
    const {user} = this.props
    console.log("user render", user)
    return <div>{user.id}{user.firstName}</div>
  }
}

const userQuery = gql`
  query userQuery($id: Int) {
    user(id: $id) @cache {
      id
      firstName
      lastName
    }
  }
`

const UserContainer = graphql(userQuery, {
  props: ({data: {loading, user}}) => {
    console.log(loading, 'loading', user)
    return {user: loading ? {} : user }
  },
  options: (props) => {
    return {variables: {id: props.id}}
  }
})(User)

function UserList() {
  //console.log('userlist render')
  return (
    <div>
      <UserContainer id={1} />
      <UserContainer id={2} />
      <UserContainer id={3} />
    </div>
  )
}

const ToggleContainer = compose(
  graphql(isLoggedInQuery, {
    props: ({ data: { isLoggedIn } }) => ({ isLoggedIn })
  }),
  graphql(usersQuery, {
    props: ({ data: { users } }) => ({ users })
  }),
  graphql(setFirstNameMutation),
  graphql(setLoggedInMutation, {
    name: 'setLoggedInMutation'
  })
)(Toggle);

function App() {
  //console.log("app render")
  return (
    <div>
        <ToggleContainer />
        <UserList />
    </div>
  )
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>, document.getElementById("root")
);
