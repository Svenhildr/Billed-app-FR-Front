/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
    const localStorageMock = {
        store: {},
        getItem: jest.fn((key) => localStorageMock.store[key] || null),
        setItem: jest.fn((key, value) => {
            localStorageMock.store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            localStorageMock.store = {};
        })
    };

    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
        "user",
        JSON.stringify({
            type: "Employee"
        })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);

    describe("When I am on NewBill form Page", () => {
        test("Then the form should be submitted with all required inputs", async () => {
            document.body.innerHTML = NewBillUI();

            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage
            });

            const handleSubmitForm = jest.fn(newBill.handleSubmit);
            const form = screen.getByTestId("form-new-bill");
            form.addEventListener("submit", handleSubmitForm);

            screen.getByTestId("expense-type").value = "IT et électronique";
            screen.getByTestId("expense-name").value = "toto";
            screen.getByTestId("datepicker").value = "2014-10-01";
            screen.getByTestId("amount").value = "45";
            screen.getByTestId("vat").value = "20";
            screen.getByTestId("pct").value = "5";
            screen.getByTestId("commentary").value = "toto";

            jest.spyOn(window, "alert").mockImplementation(() => {});

            const fileInput = screen.getByTestId("file");
            const file = new File(["test"], "preview-facture-free-201801-pdf-1.jpg", { type: "image/jpeg" });
            userEvent.upload(fileInput, file);

            form.submit();
            expect(handleSubmitForm).toHaveBeenCalled();
        });

        test("Then the form has an invalid file and submitted with all required inputs", async () => {
            document.body.innerHTML = NewBillUI();

            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage
            });

            const handleSubmitForm = jest.fn(newBill.handleSubmit);
            const form = screen.getByTestId("form-new-bill");
            form.addEventListener("submit", handleSubmitForm);

            const handleChangeFile = jest.fn(newBill.handleChangeFile);
            const inputFile = screen.getByTestId("file");
            inputFile.addEventListener("change", handleChangeFile);

            screen.getByTestId("expense-type").value = "IT et électronique";
            screen.getByTestId("expense-name").value = "toto";
            screen.getByTestId("datepicker").value = "2014-10-01";
            screen.getByTestId("amount").value = "45";
            screen.getByTestId("vat").value = "20";
            screen.getByTestId("pct").value = "5";
            screen.getByTestId("commentary").value = "toto";

            jest.spyOn(window, "alert").mockImplementation(() => {});

            // const fileInput = screen.getByTestId("file");
            const invalidFile = new File(["test"], "invalidFile.txt", { type: "text/plain" });
            userEvent.upload(inputFile, invalidFile);

            expect(handleChangeFile).toHaveBeenCalled();

            expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers .jpg, .jpeg ou .png sont acceptés");
            expect(inputFile.value).toBe("");

            form.submit();
            expect(handleSubmitForm).toHaveBeenCalled();
        });

        describe("When a new bill is submitted", () => {
            document.body.innerHTML = NewBillUI();
            beforeEach(() => {
                Object.defineProperty(window, "localStorage", { value: localStorageMock });
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee"
                    })
                );
                localStorage.setItem("user", JSON.stringify({ type: "employee", email: "a@a" }));
                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();
                window.onNavigate(ROUTES_PATH.Bills);
            });

            test(" The form is valid and a new bill should be created", async () => {
                const onNavigate = jest.fn();
                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage
                });

                const form = screen.getByTestId("form-new-bill");
                const expenseType = screen.getByTestId("expense-type");
                const expenseName = screen.getByTestId("expense-name");
                const datepicker = screen.getByTestId("datepicker");
                const amount = screen.getByTestId("amount");
                const vat = screen.getByTestId("vat");
                const pct = screen.getByTestId("pct");
                const commentary = screen.getByTestId("commentary");

                userEvent.selectOptions(expenseType, "IT et électronique");
                userEvent.type(expenseName, "Toto");
                userEvent.type(datepicker, "2014-10-01");
                userEvent.type(amount, "100");
                userEvent.type(vat, "20");
                userEvent.type(pct, "10");
                userEvent.type(commentary, "Toto");

                jest.spyOn(window, "alert").mockImplementation(() => {});

                const fileInput = screen.getByTestId("file");
                const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
                userEvent.upload(fileInput, validFile);

                const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
                form.addEventListener("submit", handleSubmit);
                form.submit();

                expect(handleSubmit).toHaveBeenCalled();
            });

            test(" The form is empty and is submitted", async () => {
                const onNavigate = jest.fn();
                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage
                });

                const form = screen.getByTestId("form-new-bill");
                const expenseType = screen.getByTestId("expense-type");
                const expenseName = screen.getByTestId("expense-name");
                const datepicker = screen.getByTestId("datepicker");
                const amount = screen.getByTestId("amount");
                const vat = screen.getByTestId("vat");
                const pct = screen.getByTestId("pct");
                const commentary = screen.getByTestId("commentary");

                jest.spyOn(window, "alert").mockImplementation(() => {});

                const fileInput = screen.getByTestId("file");
                const validFile = new File(["test"], "", { type: "" });
                userEvent.upload(fileInput, validFile);

                const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
                form.addEventListener("submit", handleSubmit);
                const formBtn = screen.getByTestId("formBtn");
                formBtn.click();
                form.submit();

                expect(handleSubmit).toHaveBeenCalled();
                expect(window.alert).toHaveBeenCalledWith("Veuillez remplir tous les champs nécessaires.");
                expect(onNavigate).not.toHaveBeenCalled();
            });

            test("should append file and email to FormData when a file is uploaded", async () => {
                // Object.defineProperty(window, "localStorage", { value: localStorageMock });
                localStorage.setItem("user", JSON.stringify({ type: "employee", email: "a@a" }));

                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);

                // Appel de la fonction de routage si nécessaire
                router();
                window.onNavigate(ROUTES_PATH.Bills);

                // Création d'un fichier simulé pour le test
                const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

                document.body.innerHTML = NewBillUI();
                const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

                // Espionne la méthode FormData.append
                const formDataSpy = jest.spyOn(FormData.prototype, "append");

                // Déclenche le changement de fichier
                const fileInput = screen.getByTestId("file");
                await userEvent.upload(fileInput, file);

                const formBtn = screen.getByTestId("formBtn");
                await userEvent.click(formBtn);

                // Vérifie si formData.append a bien été appelé avec "file" et le contenu du fichier
                expect(formDataSpy).toHaveBeenCalledWith("file", file);
                expect(formDataSpy).toHaveBeenCalledWith("email", "a@a");

                // Nettoie les mocks pour éviter les interférences avec d'autres tests
                formDataSpy.mockRestore();
                /*                 // Création de FormData et ajout des données
                const formData = new FormData();
                const email = JSON.parse(window.localStorage.getItem("user")).email;
                formData.append("file", file);
                formData.append("email", email);

                // Vérification que le FormData contient les bonnes valeurs
                expect(formData.get("file")).toEqual(file);
                expect(formData.get("email")).toBe("a@a");

                // Nettoyage pour éviter les effets sur d'autres tests
                window.localStorage.getItem.mockClear();
                window.localStorage.setItem.mockClear(); */
            });
        });
    });

    //test post

    describe("Given I am a user connected as Employee", () => {
        describe("When I select a file to upload", () => {
            test("fetches bills from mock API POST", async () => {
                localStorage.setItem("user", JSON.stringify({ type: "employee", email: "a@a" }));
                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();
                window.onNavigate(ROUTES_PATH.Bills);
            });
            describe("When an error occurs on API", () => {
                beforeEach(() => {
                    jest.spyOn(mockStore, "bills");
                    Object.defineProperty(window, "localStorage", { value: localStorageMock });
                    window.localStorage.setItem(
                        "user",
                        JSON.stringify({
                            type: "employee",
                            email: "a@a"
                        })
                    );
                    const root = document.createElement("div");
                    root.setAttribute("id", "root");
                    document.body.appendChild(root);
                    router();
                    window.onNavigate(ROUTES_PATH.Bills);
                });
                test("fetches bills from an API and fails with 404 message error", async () => {
                    mockStore.bills.mockImplementationOnce(() => {
                        return {
                            list: () => {
                                return Promise.reject(new Error("Erreur 404"));
                            }
                        };
                    });
                    window.onNavigate(ROUTES_PATH.Bills);
                    await new Promise(process.nextTick);
                    const message = await screen.getByText(/Erreur 404/);
                    expect(message).toBeTruthy();
                });
            });
        });
    });
});
