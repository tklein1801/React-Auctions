import React, { Component } from "react";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import Firebase from "../Firebase";
import { User } from "../ApiHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/moneybar.scss";

// TODO Performance needs to be improved by a lot
export default class Moneybar extends Component {
  render() {
    const { user } = this.props;

    if (user) {
      return (
        <div className="moneybar">
          <div className="row align-items-center">
            <Dropdown>
              <Dropdown.Toggle variant="success">
                <img src={new User().getAvatar(user.displayName)} alt="Profilbild" />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item href="../Profil/">Mein Profil</Dropdown.Item>
                <Dropdown.Item onClick={() => Firebase.auth().signOut()}>Abmelden</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      );
    } else {
      return (
        <div className="moneybar">
          <div className="row align-items-center">
            <Link className="text ml-auto" to={"../Anmelden/"}>
              Anmelden
            </Link>
          </div>
        </div>
      );
    }
  }
}
