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

        test("the form has an invalid file and should show an alert, resetting the file input", async () => {
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

            const invalidFile = new File(["test"], "invalidFile.txt", { type: "text/plain" });
            userEvent.upload(inputFile, invalidFile);

            expect(handleChangeFile).toHaveBeenCalled();
            expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers .jpg, .jpeg ou .png sont acceptés");
            expect(inputFile.value).toBe("");

            form.submit();
            expect(handleSubmitForm).toHaveBeenCalled();
        });

        describe("When a new bill is submitted", () => {
            beforeEach(() => {
                Object.defineProperty(window, "localStorage", { value: localStorageMock });
                window.localStorage.setItem(
                    "user",
                    JSON.stringify({
                        type: "Employee"
                    })
                );
                document.body.innerHTML = NewBillUI();

                localStorage.setItem("user", JSON.stringify({ type: "employee", email: "a@a" }));
                const root = document.createElement("div");
                root.setAttribute("id", "root");
                document.body.append(root);
                router();
                window.onNavigate(ROUTES_PATH.Bills);
            });
            afterEach(() => {
                document.body.innerHTML = ""; // Clean up after each test
                jest.clearAllMocks(); // Clear all mocks
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
                screen.getByTestId("expense-type").value = "";
                screen.getByTestId("expense-name").value = "";
                screen.getByTestId("datepicker").value = "";
                screen.getByTestId("amount").value = "";
                screen.getByTestId("vat").value = "";
                screen.getByTestId("pct").value = "";
                screen.getByTestId("commentary").value = "";

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
            });

            // test("should handle error when creating a bill fails", async () => {
            //     document.body.innerHTML = NewBillUI();

            //     const onNavigate = jest.fn();
            //     const newBill = new NewBill({
            //         document,
            //         onNavigate,
            //         store: mockStore,
            //         localStorage: window.localStorage
            //     });

            //     // Simuler une erreur sur la méthode `create` pour déclencher le bloc `catch`
            //     jest.spyOn(newBill.store.bills(), "create").mockImplementation(() => Promise.reject(new Error("Erreur lors de la création")));

            //     const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {}); // espionner console.error

            //     const fileInput = screen.getByTestId("file");
            //     const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
            //     userEvent.upload(fileInput, validFile);

            //     await waitFor(() => {
            //         expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Erreur lors de la création"));
            //     });

            //     consoleErrorSpy.mockRestore();
            // });
        });
    });
});
