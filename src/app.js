App = {
    contracts: {},
    account: "",
    loading: false,

    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof window.ethereum == "undefined") {
            window.alert("Please connect to Metamask.");
        }
    
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
        try {
            // Request account access
            App.loadAccount();
        } catch (error) {
            // User denied account access...
            console.error("User denied account access");
        }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:7545"
            );
        }
        web3 = new Web3(App.web3Provider);
    },

    loadContract: async () => {
        const todoList = await $.getJSON("TodoList.json");
        App.contracts.TodoList = TruffleContract(todoList);
        App.contracts.TodoList.setProvider(App.web3Provider);
        App.todoList = await App.contracts.TodoList.deployed();
        console.log(todoList);
      },

    loadAccount: async () => {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });

        App.account = accounts[0];
        console.log(App.account)
    },

    render: async () => {
        if (App.loading) {
            return;
        }

        App.setLoading(true);
        $("#account").html(App.account);
        await App.renderTasks();
        App.setLoading(false);
    },

    renderTasks: async () => {
        const taskCount = await App.todoList.taskCount();
        const $taskTemplate = $(".taskTemplate");

        for (let i = 1; i <= taskCount; i++) {
            const task = await App.todoList.tasks(i);

            const taskId = task[0].toNumber();
            const taskContent = task[1];
            const taskCompleted = task[2];

            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find(".content").html(taskContent);
            $newTaskTemplate
                .find("input")
                .prop("name", taskId)
                .prop("checked", taskCompleted)
                .on("click", App.toggleCompleted);

            if (taskCompleted) {
                $("#completedTaskList").append($newTaskTemplate);
            } else {
                $("#taskList").append($newTaskTemplate);
            }

            $newTaskTemplate.show();
        }
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $("#loader");
        const content = $("#content");
        if (boolean) {
          loader.show();
          content.hide();
        } else {
          loader.hide();
          content.show();
        }
      },
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})