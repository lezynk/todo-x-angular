(function() {
    'use strict';

    angular
        .module('models.lists', [
            'ngResource',
            'models.todos'
        ])
        .service('ListsModel', ListsModel)
    ;

    ListsModel.$inject = ['$http', '$q', 'TodosModel'];

    function ListsModel($http, $q, TodosModel) {
      var model = this,
        URLS = {
          FETCH : 'http://localhost:5000/lists'
        },
        lists,
        todos,
        currentList;

      model.readList = readList;
      model.createList = createList;
      model.getListById = getListById;
      model.updateList = updateList;
      model.deleteList = deleteList;

      // ------
      //  CRUD
      // ------

      // CREATE
      function createList(list){
        list.id = lists.length;
        lists.push(list);
      }

      // READ
      function readList(){
        return $http
          .get(URLS.FETCH)
          .then(treatLists)
          .catch(errorCall);
      }
      function treatLists(result){
        // Promises array for filling the number of todos per lists
        var promises = [];

        lists = result.data;

        // Maps over each list, counts the number of todos per each of them
        // and add the info in the object as 'numberTodo'
        lists.map(function callToTodos(x){
          promises.push(
            new Promise(function(resolve, reject) {
              TodosModel.readTodo(x.id)
                .then(function(result){
                  x.numberTodo = result.length
                  resolve(x);
                })
            })
          );
        });

        // Return a big promise that only resolves when all small
        // are resolved
        return Promise.all(promises)
          .then(resp => resp)
          .catch(errorCall);
      }
      function errorCall(result){
        var errorMessage = 'XHR Failed';
        if (result.data && result.data.description) {
          errorMessage = errorMessage + '\n' + result.data.description;
        }
        console.log(errorMessage);
        return $q.reject(result);
      }

      // UPDATE
      function updateList(list){
        var index = _.findIndex(lists,function(l){
            return l.id == list.id;
        });
        lists[index] = list;
      }

      // DELETE
      function deleteList(list){
        _.remove(lists,function(l){
            return l.id == list.id;
        });
      }

      // Sends back one list based on its ID
      function getListById(listId){
        var deferred = $q.defer();
        function findList(){
          return _.find(lists, function(l){
              return l.id == listId;
          });
        }
        if(lists){
          deferred.resolve(findList());
        } else {
          readList()
            .then(function(result){
                deferred.resolve(findList());
            });
        }
        return deferred.promise;
      }

    }
})();
