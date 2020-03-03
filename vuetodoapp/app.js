const app = new Vue({
    el: '#app',
    data: {
        title: 'Get your Tasks Done!',
        newTodo: '',
        todos: []
    },
    methods: {
        addTodo() {
            // console.log(this.newTodo);
            this.todos.push({
                title: this.newTodo,
                done: false
            });
            this.newTodo = '';
        },
        removeTodo(todo) {
            const todoIndex = this.todos.indexof(todo);
            this.todos.splice(todoIndex, 1);
        },
        allDone() {
            this.todos.forEach(todo => {
                todo.done = true;

            });
        }


    }

});