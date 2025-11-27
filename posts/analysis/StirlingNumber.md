# Stirling Number

## Stirling Formula

여기서 보이고자 하는 주된 결과는

$$n! \\thickapprox \\sqrt{2\\pi n}\\left(\\frac{n}{e}\\right)^n $$

이다. ($ \\thickapprox$ 는 우변으로 좌변을 나누고 극한을 취하면 1 이 된다는 의미이다.)

이를 조금 더 정교하게 정리하면

$$n! = \\sqrt{2\\pi n}\\left(\\frac{n}{e}\\right)^n e^{\\theta\_n} \\qquad |\\theta\_n| < \\frac1{12n}$$

가 된다. 경험상 이런 류의 결과들은 정확히 기억하는 것 쉽지 않다.

이미 포기하고 싶은 사람을 위해서 상대적으로 쉬운 것부터 준비했다.

### 1.  $n!$이 $ n^n$ 의 대강의 비교부터 

이 비교는 굉장히 중요하다.

만약 알고리즘을 공부한 적이 있다면 $ O(n \\ln n) $ 과 $ O(\\ln n!) $ 의 바꿔치기를 본 적이 있을 것이다.

비단 알고리즘뿐만 아니라 여기저기서 마주치게 된다.

그러니 이왕 이 페이지를 봤다면 여기 1 의 내용이라도 읽고 포기하자.

\[ 내가 아는 가장 쉬운 방법 \]

우선 $n! \\le n^n$ 은 쉽게 이해할 수 있다.

(1부터 100까지 곱한 것과 100 을 100개 곱한 것은 어느 쪽이 클까?)

이번에는 수학적 귀납법을 출동시켜서 $ (n/e)^n \\le n! $ 임을 보이자.

$n$ 까지는 성립한다고 가정하고 $n+1$ 을 들여다 보자.

\\begin{eqnarray} \\left(\\frac{n+1}{e}\\right)^{n+1} &=& \\left(\\frac{n+1}{e}\\right)^n \\cdot \\frac{n+1}e \\\\ &=& \\left(\\frac{n}{e}\\right)^n \\left(\\frac{n+1}{n}\\right)^n \\cdot \\frac{n+1}e \\\\ &\\le & \\left(\\frac{n}{e}\\right)^n (n+1) \\\\ &\\le & (n+1)! \\end{eqnarray}

$ \\left( \\frac{n+1}n \\right)^n < e $ 와 귀납 가정이 사용되었다. 

현재까지 $(\\frac{n}{e})^n \\le n! \\le n^n $ 임을 알았고 $\\ln$ 을 취하면

$$ n\\ln n -n \\le \\ln n! \\le n\\ln n $$

을 알게 되었다. 하하하!

수고했다. 힘들면 여기서 그만 나가도 된다.

### 2\. Wallis Integrals

뜬금 없을지 모르지만 Wallis integrals 을 알아 보자. Wallis integrals는

$$ I\_n = \\int\_0^{\\pi/2} \\sin^n t dt $$

를 말한다. 고교과정 참고서에도 부분적분 연습문제로 등장하는데

$$ (n+2) I\_{n+2} = (n+1) I\_n \\Longleftrightarrow I\_{n+2} = \\frac{n+1}{n+2}I\_n $$

을 이끌어 내어야 한다. 그러고 나면 덤으로

$$(n+1)I\_n I\_{n+1} = nI\_{n-1}I\_n = \\cdots = I\_0 I\_1 = \\frac{\\pi}2$$

와

$$I\_{2n}= \\frac{2n-1}{2n} \\frac{2n-3}{2n-2} \\cdots \\frac{1}{2} \\frac{\\pi}2 = \\frac{(2n)!}{2^{2n+1}(n!)^2} \\pi$$

을 얻을 수 있다.

### 3\. 뭔가 비교해보자.

조금 전에 얻은 결과를 반영하면

$$ 1 \\le \\frac{I\_n}{I\_{n+1}} \\le \\frac{I\_n}{I\_{n+2}} = \\frac{n+2}{n+1} $$

을 알 수 있고 이로부터

$$ \\lim\_{n\\rightarrow\\infty} \\frac{I\_n}{I\_{n+1}} = 1$$

임을 안다. 한 가지 더

$$ \\lim\_{n\\rightarrow\\infty} \\sqrt{2n}I\_n = \\sqrt{\\pi} $$

은 Stirling formula로 우리를 이끌어 줄 것이다.

### 4\. 수열 $d\_n = \\frac{n!}{\\sqrt{n}} \\left(\\frac{e}{n}\\right)^n $ 은 감소한다!

이 수열의 증감, 수렴성등은

$$ \\ln d\_n - \\ln d\_{n+1} = \\left(n+\\frac12\\right) \\ln\\left(\\frac{n+1}{n}\\right) - 1 = \\left(n+\\frac12\\right) \\ln\\frac{1+\\frac1{2n+1}}{1-\\frac1{2n+1}} - 1$$

으로부터 모두 얻어진다. 응?

미적분학 페이지에서 다룬 바가 있는 지식을 상기해야 한다. $|x|<1$일 때,

$$ g(x) := \\frac1{1-x} = \\sum\_{n=0}^\\infty x^n $$

의 양변을 적분하여

$$ -\\ln(1-x) = \\sum\_{n=0}^\\infty \\frac{x^{n+1}}{n+1} = \\sum\_{n=1}^\\infty \\frac{x^n}n $$

을 얻고 이를 변형하여

$$\\ln(1+x)=\\sum\_{n=1}^\\infty \\frac{(-1)^{n-1}x^n}{n}= x-\\frac{x^2}2 + \\frac{x^3}3 - \\frac{x^4}4 + \\cdots$$

도 얻는다.

둘을 합하면

$$ \\ln \\frac{1+x}{1-x} = 2\\left(x + \\frac13 x^3 + \\frac15 x^5 + \\cdots \\right) $$

이 되는데 $x = \\frac1{2n+1}$을 대입하면

\\begin{eqnarray} \\ln d\_n-\\ln d\_{n+1} &=& (2n+1)\\left(\\frac1{2n+1}+\\frac13\\left(\\frac1{2n+1}\\right)^3 + \\frac15\\left(\\frac1{2n+1}\\right)^5 + \\cdots \\right) - 1 \\\\ & = & \\frac13\\left(\\frac1{2n+1}\\right)^2 + \\frac15\\left(\\frac1{2n+1}\\right)^4 + \\cdots \\end{eqnarray}

이 된다.

이제 수열 $(d\_n)$이 감소수열임은 알 수 있을 것이다.  

### 5\. $d\_n = \\frac{n!}{\\sqrt{n}} \\left(\\frac{e}{n}\\right)^n $ 은 수렴한다!

수렴성은 어떻게 알 수 있나? 또 비교하자.

등비급수와 비교해보자.('비교'라는 단어는 지겨워지면 안되는 마법의 단어이다.)

\\begin{eqnarray} \\ln d\_n-\\ln d\_{n+1} & = & \\frac13\\left(\\frac1{2n+1}\\right)^2 + \\frac15\\left(\\frac1{2n+1}\\right)^4 + \\cdots \\\\ & \\le & \\frac13 \\left( \\left(\\frac1{2n+1}\\right)^2 + \\left(\\frac1{2n+1}\\right)^4 + \\cdots \\right)\\\\ & = & \\frac13 \\frac1{(2n+1)^2} \\frac1{1-\\frac1{(2n+1)^2}}\\\\ & = & \\frac1{12n} - \\frac1{12(n+1)} \\end{eqnarray}

흠... 감소하는 수열이 아래쪽으로 한계가 생겼다? 그렇다. 수렴한다.

너무 길어지니까 결론은 다음 편으로 미루고 일단 몇 가지 기억하고 가자.

위 식을 이용하여

$$\\ln d\_n- \\frac1{12n} \\le \\ln d\_{n+1} -\\frac1{12(n+1)} $$

을 얻고 새로운 수열 $d\_n - \\frac1{12n}$이 증가수열임을 알게 된다. ---

그리고 $d\_n - \\frac1{12n}$의 극한값은 $\\log \\sqrt{2\\pi} $ 이다. 

(이 사실을 얻는 것은 귀찮은 과정이어서 다음 편으로 미루겠다.)

그리고 위의 식을 다른 방식으로 변형해서 다음을 얻는다.

\\begin{eqnarray} \\ln d\_n-\\ln d\_{n+1} & = & \\frac13\\left(\\frac1{2n+1}\\right)^2 + \\frac15\\left(\\frac1{2n+1}\\right)^4 + \\cdots \\\\ & \\ge & \\frac13  \\left(\\frac1{2n+1}\\right)^2 \\\\ & \\gt & \\frac1{12n+1} - \\frac1{12(n+1)+1} \\end{eqnarray}

그리고 이는 $d\_n - \\frac1{12n+1}$ 이 감소 수열임을 보여준다.