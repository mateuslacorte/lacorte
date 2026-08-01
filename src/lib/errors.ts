export class PeerConnectionError extends Error {
  name = 'PeerConnectionError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PeerConnectionError.prototype);
  }
}

export class SessionExpiredError extends Error {
  name = 'SessionExpiredError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

export class RoomNotFoundError extends Error {
  name = 'RoomNotFoundError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RoomNotFoundError.prototype);
  }
}
