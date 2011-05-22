Example code for an upcoming blog post.

## Browser support

* Chrome: all tests OK;
* Safari: there are random failures in the Selenium tests (I've not investigated further yet).
* Firefox: offline mode doesn't work, due to a different behavior with cached resources (I will explain this better in the post).

## Running

Install the Play! framework as explained [here](http://www.playframework.org/documentation/1.2.1/guide1#aInstallingthePlayframeworka).

To run the application, type `play run` in the application's root directory.

To run the unit tests, type `play test`, navigate to http://localhost:9000/@test and click the 'Run all' link.


## Reading the code

If you're new to Play!, this should get you started:

* `conf/routes` maps URIs to controller methods (controllers are in `app/controllers`);
* when a controller calls `render()`, the corresponding template in `app/views` is invoked.

For more information, refer to [the Play! documentation](http://www.playframework.org/documentation/1.2.1/home).
