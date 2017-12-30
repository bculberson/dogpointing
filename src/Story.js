import React, {
  Component,
} from 'react';
import './Story.css';
import PropTypes from 'prop-types';
import AWSMqtt from 'aws-mqtt';
import AWS from 'aws-sdk';

class Story extends Component {
  constructor(props) {
    super(props);

    this.state = {
      storyName: 'New Story',
      latestStory: null,
      voteValue: '',
      initialized: false,
      voteDisabled: false,
    };

    this.handleStoryNameChange = this.handleStoryNameChange.bind(this);
    this.handleVoteChange = this.handleVoteChange.bind(this);
    this.handleVoteSubmit = this.handleVoteSubmit.bind(this);
    this.createStory = this.createStory.bind(this);
    this.getLatestStory = this.getLatestStory.bind(this);
    this.initWs = this.initWs.bind(this);
    this.showVoteValue = this.showVoteValue.bind(this);
    this.lastInteraction = new Date();
    this.mqttClient = null;

    this.initWs();
  }

  initWs(e) {
    if (this.props.sessionKey === '') {
      return;
    }

    // get latest story
    this.getLatestStory();

    // subscribe to all story updates
    const credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: 'us-east-2:71910967-8a76-4636-b3c5-0ea6bbf1b19d' }, { region: 'us-east-2' });
    const endpoint = 'aqqaj5ktpns1h.iot.us-east-2.amazonaws.com';
    const region = 'us-east-2';
    const topic = `dp/${this.props.sessionKey}`;

    if (this.mqttClient == null) {
      this.mqttClient = new AWSMqtt.connect({
        WebSocket: window.WebSocket,
        credentials,
        endpoint,
        region,
        clientId: `mqtt-client-${Math.floor((Math.random() * 100000) + 1)}`,
      });

      this.mqttClient.on('connect', () => {
        this.mqttClient.subscribe(topic);
      });

      this.mqttClient.on('message', (topic, message) => {
        const latestStory = JSON.parse(message.toString());
        if (this.state.latestStory == null || this.state.latestStory.story_key !== latestStory.story_key) {
          this.setState({ voteValue: '', latestStory, initialized: true });
        } else if (parseInt(latestStory.story_key, 10) >= parseInt(this.state.latestStory.story_key, 10)) {
          this.setState({ latestStory, initialized: true });
        }
      });
    }
  }

  getLatestStory() {
    const gSI = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      cache: 'default',
    };

    const gSR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story?latest=true`, gSI);
    fetch(gSR, gSI).then(resp => resp.json()).then((data) => {
      if (data.length > 0) {
        const latestStory = data[0];
        this.setState({ voteValue: '', latestStory, initialized: true });
      } else {
        this.setState({ initialized: true });
      }
    }).catch((error) => {
      console.error(`error: ${error}`);
    });
  }

  createStory(e) {
    e.preventDefault();
    this.lastInteraction = new Date();
    const cSI = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: this.state.storyName }),
      mode: 'cors',
      cache: 'default',
    };

    const cSR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story`, cSI);
    fetch(cSR, cSI).then(resp => resp.json()).then((data) => {
      if (this.state.latestStory == null || parseInt(data.story_key, 10) >= parseInt(this.state.latestStory.story_key, 10)) {
        this.setState({
          latestStory: data,
          voteValue: '',
          initialized: true,
          voteDisabled: data.complete,
        });
      }
    }).catch((error) => {
      console.error(`error: ${error}`);
    });
  }

  handleStoryNameChange(e) {
    this.setState({
      storyName: e.target.value,
    });
  }

  handleVoteSubmit(e) {
    e.preventDefault();
    const vI = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_key: this.props.userKey, vote: this.state.voteValue }),
      mode: 'cors',
      cache: 'default',
    };

    const vR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story/${this.state.latestStory.story_key}`, vI);
    fetch(vR, vI).then(resp => resp.json()).then((data) => {
      this.setState({
        latestStory: data,
        initialized: true,
        voteDisabled: data.complete,
      });
    }).catch((error) => {
      console.error(`error: ${error}`);
    });
  }

  handleVoteChange(e) {
    this.lastInteraction = new Date();
    this.setState({ voteValue: e.target.value });
  }

  showVoteValue(vote) {
    if (this.state.latestStory.complete) {
      return vote.value;
    }
    if (this.props.userKey === vote.key && vote.value !== 'Cat') {
      return vote.value;
    }
    if (vote.value !== 'Cat') {
      return 'voted';
    }
    return 'voting...';
  }

  render() {
    return (
      <div className="App">
        <form onSubmit={this.createStory}>
          <input
            type="text"
            defaultValue={
    this.state.storyName
    }
            size="12"
            onChange={
    this.handleStoryNameChange
    }
          />
          <input
            type="Submit"
            value="New Story"
            readOnly="true"
          />
        </form>
        {this.state.latestStory != null && this.state.latestStory.votes != null &&
          <div>
            <table style={{ margin: '0px auto' }}>
              <thead>
                <tr>
                  <td colSpan="2"><b>{this.state.latestStory.name}</b></td>
                </tr>
              </thead>
              <tbody>
                {this.state.latestStory.votes.map(vote =>
            (<tr key={vote.key}>
              <td>{vote.name}</td>
              <td>{this.showVoteValue(vote)}</td>
            </tr>))}
              </tbody>
            </table>
            <form onSubmit={this.handleVoteSubmit}>
              <div className="dog-selector">
                <input id="Chihuahua" type="radio" name="dogs" value="Chihuahua" checked={this.state.voteValue === 'Chihuahua'} onChange={this.handleVoteChange} />
                <label className="house-dog Chihuahua" htmlFor="Chihuahua" />
                <input id="Corgi" type="radio" name="dogs" value="Corgi" checked={this.state.voteValue === 'Corgi'} onChange={this.handleVoteChange} />
                <label className="house-dog Corgi"htmlFor="Corgi" />
                <input id="Pitbull" type="radio" name="dogs" value="Pitbull" checked={this.state.voteValue === 'Pitbull'} onChange={this.handleVoteChange} />
                <label className="house-dog Pitbull"htmlFor="Pitbull" />
                <input id="Labrador" type="radio" name="dogs" value="Labrador" checked={this.state.voteValue === 'Labrador'} onChange={this.handleVoteChange} />
                <label className="house-dog Labrador"htmlFor="Labrador" />
                <input id="GreatDane" type="radio" name="dogs" value="Great Dane" checked={this.state.voteValue === 'Great Dane'} onChange={this.handleVoteChange} />
                <label className="house-dog GreatDane" htmlFor="GreatDane" />
              </div>
              <input type="Submit" value="Vote" readOnly="true" disabled={this.state.voteDisabled} />
            </form>
          </div>
        }
      </div>

    );
  }
}

Story.propTypes = {
  sessionKey: PropTypes.string.isRequired,
  userKey: PropTypes.string.isRequired,
  observer: PropTypes.bool.isRequired,
};

export default Story;
