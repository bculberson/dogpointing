import React, {
  Component,
} from 'react';
import DogNames from './DogNames';
import PropTypes from 'prop-types';

class User extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: DogNames[Math.floor(Math.random() * DogNames.length)],
      showName: true,
      observer: false,
    };

    this.handleNameSubmit = this.handleNameSubmit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleObserverChange = this.handleObserverChange.bind(this);
  }

  handleNameChange(e) {
    this.setState({
      name: e.target.value,
    });
  }

  handleObserverChange(e) {
    console.log(e.target.checked);
    this.setState({
      observer: e.target.checked,
    });
  }

  handleNameSubmit(e) {
    e.preventDefault();
    if (this.state.name.length === 0) {
      console.error(`Invalid Name: ${this.state.name}`);
    } else {
      const cUI = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: this.state.name, observer: this.state.observer }),
        mode: 'cors',
        cache: 'default',
      };

      const cUR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/user`, cUI);
      fetch(cUR, cUI).then(resp => resp.json()).then((data) => {
        this.props.onChange(data.user_key, this.state.name, this.state.observer);
        this.setState({
          showName: false,
        });
      }).catch((error) => {
        console.error(`error: ${error}`);
      });
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-intro" style={{ display: (this.state.showName ? 'inline-block' : 'none') }}>
        Answers to&nbsp;
          <form onSubmit={this.handleNameSubmit}>
            <input
              type="text"
              value={
      this.state.name
      }
              size="12"
              onChange={
      this.handleNameChange
      }
            /><br />
          &nbsp;Observe?&nbsp;
            <input type="checkbox" value={this.state.observer} onChange={this.handleObserverChange} />
            <br />
            <input type="Submit" value="Submit" readOnly="true" />
          </form>
        </div>
        <span className="App-intro" style={{ display: (!this.state.showName ? 'inline-block' : 'none') }}>
          <b>Answers to&nbsp;{this.state.name}</b>
        </span>
      </div>
    );
  }
}

User.propTypes = {
  onChange: PropTypes.func.isRequired,
  sessionKey: PropTypes.string.isRequired,
};

export default User;
