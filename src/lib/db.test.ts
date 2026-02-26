describe("db", () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  it("initializes with FIRESTORE_SERVICE_ACCOUNT_KEY", () => {
    const certMock = jest.fn().mockReturnValue("cert-obj");
    const initializeAppMock = jest.fn().mockReturnValue("app");
    const getAppsMock = jest.fn().mockReturnValue([]);
    const getFirestoreMock = jest.fn().mockReturnValue("db");

    process.env.FIRESTORE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: "p1",
      client_email: "a@b.com",
      private_key: "line1\\nline2",
    });

    jest.doMock("firebase-admin/app", () => ({
      cert: certMock,
      initializeApp: initializeAppMock,
      getApps: getAppsMock,
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: getFirestoreMock,
      Firestore: function () {},
    }));

    const { getDb } = require("@/lib/db");
    expect(getDb()).toBe("db");
    expect(certMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        clientEmail: "a@b.com",
        privateKey: "line1\nline2",
      })
    );
  });

  it("reuses existing app and caches db instance", () => {
    const existingApp = { name: "existing" };
    const certMock = jest.fn();
    const initializeAppMock = jest.fn();
    const getAppsMock = jest.fn().mockReturnValue([existingApp]);
    const getFirestoreMock = jest.fn().mockReturnValue("cached-db");

    jest.doMock("firebase-admin/app", () => ({
      cert: certMock,
      initializeApp: initializeAppMock,
      getApps: getAppsMock,
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: getFirestoreMock,
      Firestore: function () {},
    }));

    const { getDb } = require("@/lib/db");
    expect(getDb()).toBe("cached-db");
    expect(getDb()).toBe("cached-db");
    expect(getFirestoreMock).toHaveBeenCalledTimes(1);
    expect(initializeAppMock).not.toHaveBeenCalled();
  });

  it("initializes with split env vars and normalizes private key", () => {
    const certMock = jest.fn().mockReturnValue("cert");
    const initializeAppMock = jest.fn().mockReturnValue("app");
    const getAppsMock = jest.fn().mockReturnValue([]);
    const getFirestoreMock = jest.fn().mockReturnValue("db");

    process.env.FIRESTORE_PROJECT_ID = "project";
    process.env.GCP_CLIENT_EMAIL = "svc@project.iam.gserviceaccount.com";
    process.env.GCP_PRIVATE_KEY = "'line1\\nline2'";

    jest.doMock("firebase-admin/app", () => ({
      cert: certMock,
      initializeApp: initializeAppMock,
      getApps: getAppsMock,
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: getFirestoreMock,
      Firestore: function () {},
    }));

    const { getDb } = require("@/lib/db");
    getDb();
    expect(certMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project",
        privateKey: "line1\nline2",
      })
    );
  });

  it("throws when required env vars are missing", () => {
    const certMock = jest.fn();
    const initializeAppMock = jest.fn();
    const getAppsMock = jest.fn().mockReturnValue([]);
    const getFirestoreMock = jest.fn();

    delete process.env.FIRESTORE_SERVICE_ACCOUNT_KEY;
    delete process.env.FIRESTORE_PROJECT_ID;
    delete process.env.GCP_CLIENT_EMAIL;
    delete process.env.GCP_PRIVATE_KEY;

    jest.doMock("firebase-admin/app", () => ({
      cert: certMock,
      initializeApp: initializeAppMock,
      getApps: getAppsMock,
    }));
    jest.doMock("firebase-admin/firestore", () => ({
      getFirestore: getFirestoreMock,
      Firestore: function () {},
    }));

    const { getDb } = require("@/lib/db");
    expect(() => getDb()).toThrow("Missing Firestore credentials");
  });
});
