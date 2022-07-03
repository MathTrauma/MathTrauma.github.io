---
layout : default
title: basic shell programming 2
---

간단한 스크립트.

{%highlight bash linenos %}

#!/bin/bash
#second.sh

echo "MathTrauma!"

exit 0

{% endhighlight %}

exit 코드를 읽기 위해서는 

{%highlight bash linenos %}

$ second.sh

$ echo $?

{% endhighlight %}
