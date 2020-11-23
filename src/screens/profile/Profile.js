import React, { Component, createRef } from "react";
import { Link, Redirect } from "react-router-dom";
import { Col, Form, ButtonGroup, Button, Nav, Tab, Table, Badge } from "react-bootstrap";
import Firebase, { firestore } from "../../Firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import Loader from "../../components/Loader";
import { Offer } from "../../components/Card";
import { toast as toastConfig } from "../../config.json";
import ToastService from "react-material-toast";
import { CreateOffer } from "../../components/Modals";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Profil.scss";

class BuyHistory extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    // TODO Get bought offers from firebase
    let temp = [];
  }

  render() {
    let { loading } = this.state;

    if (loading) {
      return <Loader />;
    } else {
      return (
        <div className="w-100 p-4 bg-light rounded">
          <h1>Käufe</h1>
        </div>
      );
    }
  }
}

class SellHistory extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    // TODO Get sold offers from firebase
    let temp = [];

    // Check if the user is signed in via Firebase
    Firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        let userId = user.uid;
        firestore
          .collection("user")
          .doc(userId)
          .onSnapshot((snapshot) => {
            let doc = snapshot.data(),
              offers = doc.offers;

            offers.forEach((offerId) => {
              firestore
                .collection("offers")
                .doc(offerId)
                .get()
                .then((doc) => {
                  let offer = doc.data();
                  offer.id = offerId;
                  temp.push(offer);
                })
                .then(() => {
                  this.setState({ offers: temp, loading: false });
                });
            });
          });
      }
    });
  }

  render() {
    let { loading, offers } = this.state;

    if (loading) {
      return <Loader />;
    } else {
      return (
        <div className="w-100 bg-light rounded">
          <Table className="no-wrap" responsive hover borderless>
            <thead>
              <tr className="text-center">
                <th>Status</th>
                <th>Typ</th>
                <th>Angebot</th>
                <th>Aktueller Preis</th>
                <th>Käufer</th>
              </tr>
            </thead>
            <tbody>
              {offers.length > 0 ? (
                offers.map((offer, index) => {
                  return (
                    <tr key={index} className="text-center">
                      <td>
                        {/* FIXME We wanna check if the offer is aktuell, abgelaufen, verkauft */}
                        <Badge variant="warning">Aktuell</Badge>
                      </td>
                      <td>
                        <Badge variant="success">
                          {offer.type == 1 ? "Auktion" : "Sofortkauf"}
                        </Badge>
                      </td>
                      <td>
                        <Link
                          to={`/Angebot/${offer.id}`}
                          className="text-dark text-decoration-none font-weight-bold"
                        >
                          {offer.name}
                        </Link>
                      </td>
                      <td>
                        <p className="font-weight-bold mb-0">
                          {offer.price.toLocaleString(undefined)} €
                        </p>
                      </td>
                      <td>
                        <p className="font-weight-bold mb-0">
                          {offer.sold !== undefined ? offer.sold.username : "Kein Käufer"}
                        </p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="text-center">
                  <td colSpan="5">
                    <p className="font-weight-bold mb-0">Keine Angebote gefunden</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      );
    }
  }
}

class Offers extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    const offerList = [],
      ids = [],
      userId = Firebase.auth().currentUser.uid;

    // We don't need to check if the user is signed in because the parent component will check if the
    // current authentification-state and redirect any user which isn't signed in to the sign-in screen
    firestore
      .collection("user")
      .doc(userId)
      .onSnapshot((snapshot) => {
        const doc = snapshot.data(),
          offers = doc.offers.reverse(); // We gonna reverse the array so have them sorted by the newest offer

        offers.forEach((offerId) => {
          firestore
            .collection("offers")
            .doc(offerId)
            .get()
            .then((doc) => {
              const offer = doc.data(),
                now = Date.now() / 1000;
              if (offer.expiresAt.seconds > now && !ids.includes(offerId)) {
                offer.id = offerId;
                ids.push(offerId);
                offerList.push(offer);
              }
            })
            .then(() => this.setState({ offers: offerList, loading: false }));
        });
      });
  }

  render() {
    let { loading, offers } = this.state;

    if (loading) {
      return <Loader />;
    } else {
      return (
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
          {offers.length > 0 ? (
            offers.map((offer, index) => {
              return (
                <Col xs={12} md={6} lg={6} xl={6} key={index} className={"offer-column mb-3"}>
                  <div>
                    <Link to={`/Angebot/${offer.id}`} style={{ textDecoration: "none" }}>
                      <Offer
                        type={offer.type}
                        thumbnail={offer.images.thumbnail}
                        name={offer.name}
                        description={offer.description}
                        price={offer.price}
                      />
                    </Link>
                  </div>
                </Col>
              );
            })
          ) : (
            <div className="bg-light mx-auto px-4 py-3 rounded">
              <h3 className="font-weight-bold text-center mb-0">Keine Angebote gefunden</h3>
            </div>
          )}
        </div>
      );
    }
  }
}

class Profile extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      editProfile: false,
      offerModal: false,
      avatar: "https://files.dulliag.de/web/images/logo.jpg",
    };
    this.toast = ToastServive.new(toastConfig);
    this.modalRef = createRef();
  }

  toggleProfileState = () =>
    this.setState((prevState) => ({
      editProfile: !prevState.editProfile,
    }));

  handleProfileSubmit = (e) => {
    e.preventDefault();
    const { user } = this.state;
    const { email, password, apiKey } = e.target.elements,
      authentificatedUser = Firebase.auth().currentUser;
    console.log(email.value, password.value, apiKey.value);

    let updateEmail =
        email.value !== user.email ? authentificatedUser.updateEmail(email.value) : null,
      updatePassword =
        password.value !== "" ? authentificatedUser.updatePassword(password.value) : null,
      updateKey =
        apiKey.value !== user.apiKey ? localStorage.setItem("@dag_apiKey", apiKey.value) : null;

    this.toggleProfileState();
    Promise.all([updateEmail, updatePassword, updateKey])
      .then((results) => {
        this.toast.success("Die Änderungen wurden gespeichert");
      })
      .catch((err) => {
        console.error(err);
        switch (err.code) {
          case "auth/requires-recent-login":
            const user = Firebase.auth().currentUser,
              alreadyVerified = user.emailVerified;

            alreadyVerified
              ? this.toast.info(
                  "Bitte melde dich einmal neu an bevor du dein Profil bearbeiten kannst"
                )
              : this.toast.error(
                  "Du musst deine E-Mail Adresse erst bestätigen bevor du sie ändern kannst"
                );
            break;
          default:
            this.toast.error("Die Änderungen konnten nicht gespeichert werden");
            break;
        }
      });
  };

  componentDidMount() {
    // Check if the user is signed in via Firebase
    Firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        let userId = user.uid;
        firestore
          .collection("user")
          .doc(userId)
          .get()
          .then((doc) => {
            user.username = doc.data().username;
            user.apiKey = localStorage.getItem("@dag_apiKey");
            this.setState({
              authentificated: true,
              loading: false,
              user: user,
              email: user.email,
              apiKey: localStorage.getItem("@dag_apiKey"),
            });
          });
      } else {
        this.setState({ authentificated: false, loading: false });
      }
    });
  }

  render() {
    let { loading, authentificated } = this.state;
    let { editProfile, avatar, user, email, apiKey, offerModal } = this.state;

    if (loading) {
      return null;
    } else {
      if (authentificated) {
        return (
          <section>
            <div>
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                <Col id="profile-container" className="px-0 px-md-3" xs={12} md={4} lg={4}>
                  <div className="bg-light w-100 p-4 rounded">
                    <img id="avatar" className="mb-3" alt="Profilbild" src={avatar} />
                    <form onSubmit={this.handleProfileSubmit}>
                      <p className="font-weight-bold text-center">
                        @{user.username}
                        <a className="text-success ml-2" onClick={() => this.toggleProfileState()}>
                          <FontAwesomeIcon icon={faPencilAlt} className="icon" />
                        </a>
                      </p>

                      <ButtonGroup className={editProfile ? "w-100 mb-3" : "d-none"}>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            this.toggleProfileState();
                            this.setState({ email: user.email, apiKey: user.apiKey });
                          }}
                        >
                          Abbrechen
                        </Button>
                        {/* TODO Submit the new profile data */}
                        <Button type="submit" variant="success">
                          Speichern
                        </Button>
                      </ButtonGroup>

                      <Form.Group className="mb-0">
                        <Form.Label className="font-weight-bold">E-Mail</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          readOnly={!editProfile}
                          value={email}
                          onChange={(e) => this.setState({ email: e.target.value })}
                        />
                      </Form.Group>

                      <Form.Group className="mb-0">
                        <Form.Label className="font-weight-bold">Passwort</Form.Label>
                        <Form.Control
                          type="text"
                          name="password"
                          placeholder="Passwort unsichtbar"
                          onChange={(e) => this.setState({ password: e.target.value })}
                        />
                      </Form.Group>

                      <Form.Group className="mb-0">
                        <Form.Label className="font-weight-bold">API-Key</Form.Label>
                        <Form.Control
                          type="text"
                          name="apiKey"
                          value={apiKey}
                          onChange={(e) => this.setState({ apiKey: e.target.value })}
                        />
                      </Form.Group>
                    </form>
                  </div>
                </Col>
                <Col id="profile-content" className="px-0 px-md-3" xs={12} md={8} lg={8}>
                  <Tab.Container defaultActiveKey="offers">
                    <div className="w-100 p-4 bg-light rounded mb-3">
                      <Nav variant="pills" display="row">
                        <Nav.Link eventKey="offers">Angebote</Nav.Link>
                        <Nav.Link eventKey="sell-history">Verkaufshistorie</Nav.Link>
                        <Nav.Link eventKey="buy-history">Kaufhistorie</Nav.Link>
                        <Nav.Link id="create-offer" onClick={() => this.modalRef.handleShow()}>
                          Angebot erstellen
                        </Nav.Link>
                      </Nav>
                    </div>
                    <Tab.Content>
                      <Tab.Pane eventKey="offers">
                        <Offers />
                      </Tab.Pane>
                      <Tab.Pane eventKey="sell-history">
                        <SellHistory />
                      </Tab.Pane>
                      <Tab.Pane eventKey="buy-history">
                        <BuyHistory />
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Col>
              </div>
              <CreateOffer shown={offerModal} ref={(target) => (this.modalRef = target)} />
            </div>
          </section>
        );
      } else {
        // Redirect to the sign in page?
        return <Redirect to={"../Anmelden/"} />;
      }
    }
  }
}

export { Offers, BuyHistory, SellHistory };
export default Profile;
