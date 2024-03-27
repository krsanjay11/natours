const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express(); // express adds bunch of method to our app variable

// 1) Middlewares
app.use(morgan('dev')); // middleware help in login, GET /api/v1/tours/22 404 4.694 ms - 40

app.use(express.json()); // middleware - a function that can modify the incoming request data, stands in middele or between of a request and response, a step that request go through while it is been processed, here data from the body is added to request object

// create our own middleware function, define a middleware, apply to below functions only, not above functions, order matters in express
app.use((req, res, next) => {
  console.log('Hello from the middle ware 😯');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`),
);

// 2) Route handlers
const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

const getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    // (err) => {
    () => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    },
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: {
      tour: null,
    },
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not uet defined!',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not uet defined!',
  });
};

const createUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not uet defined!',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not uet defined!',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not uet defined!',
  });
};

// 3) routes
// app - router
// better way to writing a route as it will aloow us to chaining, handler separated from the routes

app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.route('/api/v1/users').get(getAllUsers).post(createUser);

app
  .route('/api/v1/users/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

// 4) Start server
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
// http://127.0.0.1:3000/

/*
// app.get('/', (req, res) =>{ // get is http method for request, (req, res) - route handler
//     // res.status(200).send('Hello from the server side!!!');
//     res
//         .status(200)
//         .json({message: 'Hello from the server side!!!', app: "Natours"}); // automatically set our content type to application/json
// });

// app.post('/', (req, res) => {
//     res
//         .status(200)
//         .send('You can post to this endpoint...');
// });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

app.get('/api/v1/tours', (req, res) => {
    res.status(200).json({
        // JSent json standard format 
        status: 'success',
        results: tours.length,
        data: {
            // tours: tours
            tours
        }
    });
});


// app.get('/api/v1/tours/:id/:x?/:y?', (req, res) => {
app.get('/api/v1/tours/:id', (req, res) => {
    // console.log(req.params); // { id: '5' } or { id: '5', x: 'sanjay', y: undefined }
    const id = req.params.id * 1; // multiply will convert that string to number 
    const tour = tours.find(el => el.id === id); // find method will create array of that element only

    // if(id > tours.length){
    if(!tour){
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        })
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

app.post('/api/v1/tours', (req, res) => {
    // req object - holds all the data, all the information about the request
    // console.log(req.body); // body is due to middleware 
    const newId = tours[tours.length-1].id + 1;
    const newTour = Object.assign({id: newId}, req.body); // allow to create a new object by merging to existing object together

    tours.push(newTour);

    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({ // the request was successfully fulfilled and resulted in one or possibly multiple new resources being created
            status: 'success',
            data: {
                tour: newTour
            }
        }); // 201 - created
    });
    // res.send('Done');
});

// not implemented patch or update here. just for test
app.patch('/api/v1/tours/:id', (req, res) => {
    if(req.params.id * 1 > tours.length){
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        })
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here...>'
        }
    });
});

// not implemented patch or update here. just for test
app.delete('/api/v1/tours/:id', (req, res) => {
    if(req.params.id * 1 > tours.length){
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        })
    }

    res.status(204).json({ // no content 
        status: 'success',
        data: {
            tour: null
        }
    });
});

const port = 3000;
app.listen(port, () => {
        console.log(`App running on port ${port}...`);
});
// http://127.0.0.1:3000/
*/
