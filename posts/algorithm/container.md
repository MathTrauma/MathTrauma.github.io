# [C++] Container 1 : vector, deque  - Adapter : queue, stack

container 들의 모든 멤버들을 한꺼번에 열거하는 것은 경험상 별 도움이 안된다. 

많은 요소들을 가진 저장소를 어떻게 이용할 것인가에 집중해보자.

#### **⚙️**  **모든 컨테이너에 공통되는 것부터**

1-1. 저장소이니 얼마나 많이 저장하고 있는가를 알고 싶다.  -> container.size( )

1-2. 혹시 비어있나? -> container.empty( );

### 1\. vector 와 deque

vector와 deque 모두 순차 접근을 기본으로 한다. 순차 접근 컨테이너를 둘로 만든 이유는 다음과 같다.

vector는 대충 배열을 이용한다고 생각하면 되는데, 알다시피 배열은 앞 부분의 원소를 추가하는데 비용이 많이 든다.

그래서 선두에 추가, 삭제가 잦은 상황에 더 효율적으로 대응하기 위한 container가 deque이다.

구현 방식은 다양할 수 있겠지만 **중요한 것은 가장 앞과 뒤에서만 추가, 삭제가 일어난다는 점**이다.

2-1. 선두 원소를 알고 싶다. => container.front( )  

2-2. 후미 원소를 알고 싶다. => container.back( )

3-1. 선두에 원소를 추가하고 싶다. => container.push\_front( )

3-2. 선두의 원소를 제거하고 싶다. => container.pop\_front( )

4-1. 후미에 원소를 추가하고 싶다. => container.push\_back( )

4-2. 끝부분의 원소를 제거하련다. => container.pop\_back( ) 

선두와 후미가 주된 작업 지점이지만 내용물들을 훑어 보고 싶을 수 있다. 

5\. iterator :  c.begin( ), c.end( ), c.rbegin( ), c.rend( ) 

6\. 다 봤으니 없애 버리자. => container.erase( )  \*주의 : 메모리를 해제하는 것은 아니고 내용물을 지운다.

이 정도면 충분하지 않을까? 이 외에도 많은 메서드들이 있지만 위의 내용들에 익숙해지고 나서 공부하자.

### 2\. queue, priority\_queue 그리고 stack

<queue> 헤더의 queue, priority\_queue 와 <stack> 헤더의 stack 은 다른 container 에 저장된 요소들에 추가적인 interface 를 제공하기 때문에 **adapter** 라고 부른다.

예를 들어, queue의 정의를 보면 다음과 같다.

**template<class T, class Container=deque<T>> class queue;**

여기서 알 수 있듯이 기본적으로는 deque 컨테이너를 이용해서 저장하고 있다. 

내막을 정확히 알아야 하는 것은 아니고 사용법만 익히면 충분하니 깊게 파고 들지는 말자.

#### (1) 용도

💡 queue 는 원소 들어온 순서대로 배출하기 위해 사용된다.(FIFO : First-In-First-Out)

\- 그렇다면 앞, 뒤 방향이 중요할까? => que.push( ), que.pop( ) 

\[deque  에서는 push\_back( ), push\_front( ) 로 방향을 구분했지만 지금을 그럴 필요가 없다!\]

**\- 다음 차례는 누구냐? => que.front( )**

💡 priority\_queue 는 **'자료형의 대소 관계'**를 이용해서 큰 쪽을 top 에 둔다. (그냥 대소 관계가 아니라 자료형의 대소 관계라 했다. 부등호를 정의하기 나름임에 주의! 참고로 이 친구는 base container 가 vector이다.) 

\- 앞, 뒤 방향이 중요하지 않은 것은 마찬가지. => pq.push( ), pq.pop( ) 

**\- 제일 쎈 놈이 누구냐? => pq.top( )**

💡 stack 은 늦게 들어온 요소가 먼저 나간다. (이를 LIFO : Last-In-First-Out 라 표현한다.)

\- 앞, 뒤 방향이 중요하지 않은 것은 마찬가지. => st.push( ), st.pop( ) 

**\- 마지막에 누가 왔었지? => st.top( )**

**이 글은 여기까지. 여기서 다룬 것만으로도 어지간한 상황에서는 충분할 것이다.**