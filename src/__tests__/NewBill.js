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

            test("should handle error when creating a bill fails", async () => {
                document.body.innerHTML = NewBillUI();

                const onNavigate = jest.fn();
                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage
                });

                jest.spyOn(mockStore, "bills").mockImplementation(() => {
                    return {
                        update: jest.fn(() => Promise.reject(new Error("Erreur lors de la création")))
                    };
                });

                const file = new File(["file content"], "file.jpg", { type: "image/jpeg" });
                const input = screen.getByTestId("file");
                fireEvent.change(input, { target: { files: [file] } });

                const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

                const form = screen.getByTestId("form-new-bill");
                fireEvent.submit(form);

                await waitFor(() => {
                    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Erreur lors de la création"));
                });

                consoleErrorSpy.mockRestore();
            });
        });
    });
});

//post

// describe("When I post a new Bill", () => {
//     const billPromise = {
//         id: "47qAXb6fIm2zOKkLzMro",
//         vat: "80",
//         fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
//         status: "pending",
//         type: "Hôtel et logement",
//         commentary: "séminaire billed",
//         name: "encore",
//         fileName: "preview-facture-free-201801-pdf-1.jpg",
//         date: "2004-04-04",
//         amount: 400,
//         commentAdmin: "ok",
//         email: "a@a",
//         pct: 20
//     };

//     const postMock = jest.spyOn(mockStore, "bills");

//     const testBillUpdate = async (mockError, expectedError) => {
//         if (mockError) {
//             mockStore.bills().update = jest.fn().mockRejectedValue(mockError);
//         } else {
//             mockStore.bills().update = jest.fn().mockResolvedValue(billPromise);
//         }

//         try {
//             const result = await mockStore.bills().update(billPromise);
//             if (mockError) {
//                 expect(result).toBeUndefined();
//                 expect(mockStore.bills().update).toHaveBeenCalledTimes(1);
//                 throw new Error("Test failed due to not throwing the expected error.");
//             }
//             expect(result).toEqual(billPromise);
//         } catch (error) {
//             if (expectedError) {
//                 expect(error.message).toEqual(expectedError.message);
//                 expect(error).toBeInstanceOf(Error);
//                 expect(error.message).toContain("Erreur lors de la création");
//             }
//         }
//     };

//     test("should handle a 404 error when updating a bill", async () => {
//         const error404 = new Error("Erreur lors de la création");
//         await testBillUpdate(error404, new Error("Erreur lors de la création"));
//     });

//     test("should handle a 500 error when updating a bill", async () => {
//         const error500 = new Error("Erreur lors de la création");
//         await testBillUpdate(error500, new Error("Erreur lors de la création"));
//     });
// });
