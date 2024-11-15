/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
// import Dashboard from "../containers/Dashboard.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
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
            await waitFor(() => screen.getByTestId("icon-window"));
            const windowIcon = screen.getByTestId("icon-window");
            expect(windowIcon).toHaveClass("active-icon");
        });
        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({ data: bills });
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = [...dates].sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });
    });

    test("Then when I click on the icon i should be redirected", async () => {
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
            "user",
            JSON.stringify({
                type: "Employee"
            })
        );

        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new Bills({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const handleClickNewBill = jest.fn((e) => newBill.handleClickNewBill(e, bills));
        const BtnNewBill = screen.getByTestId("btn-new-bill");
        BtnNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(BtnNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
    });

    test("Then when I click on the eye icon, a modal displaying a bill should open", () => {
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
            "user",
            JSON.stringify({
                type: "Employee"
            })
        );

        const newBill = new Bills({
            document,
            onNavigate,
            store: null,
            localStorage: window.localStorage
        });

        document.body.innerHTML = BillsUI({ data: bills });
        const eyeIcon = screen.getAllByTestId("icon-eye")[0];

        const handleIconEye = jest.fn(() => newBill.handleClickIconEye(eyeIcon));
        const modalMock = screen.getByTestId("modaleFile");
        eyeIcon.addEventListener("click", handleIconEye);

        //mock de la modale Bootstrap
        $.fn.modal = jest.fn().mockImplementationOnce(() => modalMock.classList.add("show"));
        userEvent.click(eyeIcon);
        expect(handleIconEye).toHaveBeenCalled();
        expect(modalMock).toHaveClass("modal fade show");
    });
});

//test GET

describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
        test("fetches bills from mock API GET", async () => {
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
            test("reject(bill) throws 404 error", async () => {
                const bill = { status: "error 404" };
                await expect(mockStore.bills().reject(bill)).rejects.toEqual({
                    status: 404,
                    message: "Erreur 404"
                });
            });

            test("reject(bill) throws 500 error", async () => {
                const bill = { status: "error 500" };
                await expect(mockStore.bills().reject(bill)).rejects.toThrow("Erreur 500");
            });
        });
    });
});
