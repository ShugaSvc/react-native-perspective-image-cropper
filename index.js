import React, {Component} from 'react';
import {Animated, Dimensions, Image, PanResponder, View} from 'react-native';
import Svg, {Polygon} from 'react-native-svg';
import ImageZoom from 'react-native-image-pan-zoom';

const DIRECTION = {
    MIDDLE_LEFT: 'MIDDLE_LEFT',
    MIDDLE_RIGHT: 'MIDDLE_RIGHT',
    MIDDLE_TOP: 'MIDDLE_TOP',
    MIDDLE_BOTTOM: 'MIDDLE_BOTTOM',
    MOVE: 'MOVE'
}

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const screenWidth = Dimensions.get('window').width;

class CustomCrop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewHeight: screenWidth * (props.height / props.width),
            height: props.height,
            width: props.width,
            image: props.initialImage,
            hideStrict: false,
            imageZoomInfo: {
                scale: 1,
                positionX: 0,
                positionY: 0,
            }
        };

        this.state = {
            ...this.state,
            topLeft: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topLeft, true) :
                    {x: 100, y: 100}
            ),
            topRight: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topRight, true) :
                    {x: screenWidth - 100, y: 100}
            ),
            bottomLeft: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomLeft, true) :
                    {x: 100, y: this.state.viewHeight - 100}
            ),
            bottomRight: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomRight, true) :
                    {x: screenWidth - 100, y: this.state.viewHeight - 100}
            ),
            imageZoomPanResponder: {panHandlers: {}},
        };

        this.state = {
            ...this.state,
            overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value} ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value},${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value},${this.state.bottomLeft.y._value}`
        };

        if (this.props.enableCornerStrict) {
            this.panResponderTopLeft = this.createPanResponser(this.state.topLeft);
            this.panResponderTopRight = this.createPanResponser(this.state.topRight);
            this.panResponderBottomLeft = this.createPanResponser(this.state.bottomLeft);
            this.panResponderBottomRight = this.createPanResponser(this.state.bottomRight);
        }
        this.state = {
            ...this.state,
            middleLeft: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topLeft.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                            y: (props.rectangleCoordinates.topLeft.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                        }
                        , true) :
                    {x: 100, y: this.state.viewHeight / 2}
            ),
            middleRight: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.bottomRight.x) / 2,
                            y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.bottomRight.y) / 2,
                        }
                        , true) :
                    {x: screenWidth - 100, y: this.state.viewHeight / 2}
            ),
            middleTop: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.topLeft.x) / 2,
                            y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.topLeft.y) / 2,
                        }
                        , true) :
                    {x: screenWidth / 2, y: 100}
            ),
            middleBottom: new Animated.ValueXY(
                props.rectangleCoordinates ?
                    this.imageCoordinatesToViewCoordinates(
                        {
                            x: (props.rectangleCoordinates.bottomRight.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                            y: (props.rectangleCoordinates.bottomRight.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                        }
                        , true) :
                    {x: screenWidth / 2, y: this.state.viewHeight - 100}
            ),
        }
        this.panResponderMiddleLeft = this.createPanResponser(this.state.middleLeft, DIRECTION.MIDDLE_LEFT);
        this.panResponderMiddleRight = this.createPanResponser(this.state.middleRight, DIRECTION.MIDDLE_RIGHT);
        this.panResponderMiddleTop = this.createPanResponser(this.state.middleTop, DIRECTION.MIDDLE_TOP);
        this.panResponderMiddleBottom = this.createPanResponser(this.state.middleBottom, DIRECTION.MIDDLE_BOTTOM);
        this._imageZoomInfo = {
            positionX: 0,
            positionY: 0,
            scale: 1,
        };

        this.state = {
            ...this.state,
            polygonPosition: {x: 0, y: 0}
        };
        this._polygonPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                this.setState({
                    hideStrict: true
                })
            },
            onPanResponderMove: (evt, gs) => {
                this.setState({polygonPosition: {x: gs.dx, y: gs.dy}});
            },
            onPanResponderRelease: (evt, gs) => {
                this.updatePoints(DIRECTION.MOVE, gs);
                this.updateOverlayString();
                this.setState({
                    hideStrict: false,
                    polygonPosition: {x: 0, y: 0},
                })
            },
        });
    }

    createPanResponser(point, direction = 'point') {
        const onMove = {};
        if (direction === 'point') {
            onMove.dx = point.x;
            onMove.dy = point.y;
        } else if (direction === DIRECTION.MIDDLE_LEFT || direction === DIRECTION.MIDDLE_RIGHT) {
            onMove.dx = point.x;
        } else {
            onMove.dy = point.y;
        }
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                point.setOffset({x: point.x._value, y: point.y._value});
                point.setValue({x: 0, y: 0});
            },
            onPanResponderMove: (evt, gs) => {
                if (this.boundaryCheck(direction, gs)) {
                    onMove.dx && onMove.dx.setValue(gs.dx);
                    onMove.dy && onMove.dy.setValue(gs.dy);
                    this.updatePoints(direction, null, true);
                    this.updateOverlayString();
                }
            },
            onPanResponderRelease: () => {
                point.flattenOffset();
            },
        });
    }

    boundaryCheck(direction, gs) {
        if (direction === DIRECTION.MIDDLE_RIGHT && gs.dx < 0)
            return (this.state.topRight.x._value - this.state.topLeft.x._value) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_LEFT && gs.dx > 0)
            return (this.state.topRight.x._value - this.state.topLeft.x._value) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_TOP && gs.dy > 0)
            return (this.state.bottomRight.y._value - this.state.topRight.y._value) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_BOTTOM && gs.dy < 0)
            return (this.state.bottomRight.y._value - this.state.topRight.y._value) > this.props.minSize;
        else
            return true;
    }

    viewCoordinatesToImageCoordinates(corner) {
        return {
            x: (this.offsetX(corner.x._value) / screenWidth) * this.state.width,
            y: (this.offsetY(corner.y._value) / this.state.viewHeight) * this.state.height,
        };
    }

    offsetX(x) {
        let maxOffSetX = screenWidth - (screenWidth / this._imageZoomInfo.scale);
        return (x / this._imageZoomInfo.scale) + (maxOffSetX / 2 - this._imageZoomInfo.positionX);
    }

    offsetY(y) {
        let maxOffSetY = this.state.viewHeight - (this.state.viewHeight / this._imageZoomInfo.scale);
        return (y / this._imageZoomInfo.scale) + (maxOffSetY / 2 - this._imageZoomInfo.positionY);
    }

    getCropData() {
        const coordinates = {
            topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
            topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
            bottomLeft: this.viewCoordinatesToImageCoordinates(this.state.bottomLeft),
            bottomRight: this.viewCoordinatesToImageCoordinates(this.state.bottomRight),
        };
        return ({
            offset: {
                x: parseInt(coordinates.topLeft.x),
                y: parseInt(coordinates.topLeft.y),
            },
            size: {
                width: parseInt(Math.abs(coordinates.topRight.x - coordinates.topLeft.x)),
                height: parseInt(Math.abs(coordinates.topLeft.y - coordinates.bottomLeft.y)),
            }
        });
    }

    setPoint(point, gs) {
        point.setValue({x: point.x._value + gs.dx, y: point.y._value + gs.dy});
    }

    updatePoints(direction, gs, isIncludeOffset = false) {
        if (direction === DIRECTION.MIDDLE_LEFT) {
            this.state.topLeft.setValue({
                x: isIncludeOffset ? this.state.middleLeft.x._value + this.state.middleLeft.x._offset : this.state.middleLeft.x._value,
                y: this.state.topLeft.y._value
            });
            this.state.bottomLeft.setValue({
                x: isIncludeOffset ? this.state.middleLeft.x._value + this.state.middleLeft.x._offset : this.state.middleLeft.x._value,
                y: this.state.bottomLeft.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_RIGHT) {
            this.state.topRight.setValue({
                x: isIncludeOffset ? this.state.middleRight.x._value + this.state.middleRight.x._offset : this.state.middleRight.x._value,
                y: this.state.topRight.y._value
            });
            this.state.bottomRight.setValue({
                x: isIncludeOffset ? this.state.middleRight.x._value + this.state.middleRight.x._offset : this.state.middleRight.x._value,
                y: this.state.bottomRight.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_TOP) {
            this.state.topLeft.setValue({
                x: this.state.topLeft.x._value,
                y: isIncludeOffset ? this.state.middleTop.y._value + this.state.middleTop.y._offset : this.state.middleTop.y._value,
            });
            this.state.topRight.setValue({
                x: this.state.topRight.x._value,
                y: isIncludeOffset ? this.state.middleTop.y._value + this.state.middleTop.y._offset : this.state.middleTop.y._value
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_BOTTOM) {
            this.state.bottomLeft.setValue({
                x: this.state.topLeft.x._value,
                y: isIncludeOffset ? this.state.middleBottom.y._value + this.state.middleBottom.y._offset : this.state.middleBottom.y._value
            });
            this.state.bottomRight.setValue({
                x: this.state.topRight.x._value,
                y: isIncludeOffset ? this.state.middleBottom.y._value + this.state.middleBottom.y._offset : this.state.middleBottom.y._value
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MOVE) {
            this.setPoint(this.state.topLeft, gs);
            this.setPoint(this.state.topRight, gs);
            this.setPoint(this.state.bottomLeft, gs);
            this.setPoint(this.state.bottomRight, gs);
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        }
    }

    updateOverlayString() {
        this.setState({
            overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value} ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value},${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value},${this.state.bottomLeft.y._value}`,
        });
    }

    imageCoordinatesToViewCoordinates(corner) {
        return {
            x: (corner.x * screenWidth) / this.state.width,
            y: (corner.y * this.state.viewHeight) / this.state.height,
        };
    }

    static defaultProps = {
        handlerColor: 'blue',
        handlerHorizontalWidth: 40,
        handlerHorizontalHeight: 10,
        minSize: 40 * 3,
        bgImageOpacity: 0.5,
        overlayStrokeColor: "blue",
        overlayStrokeWidth: 3,
        strokeDasharray: [],
        strokeDashoffset: null,
    };

    render() {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end'}}>
                <View style={[s(this.props).cropContainer, {height: this.state.viewHeight}]}>
                    <ImageZoom cropWidth={screenWidth}
                               cropHeight={this.state.viewHeight}
                               imageWidth={screenWidth}
                               imageHeight={this.state.viewHeight}
                               onPanResponderCreated={(panResponder) => {
                                   this.setState({imageZoomPanResponder: panResponder})
                               }}
                               onMove={(obj) => {
                                   this._imageZoomInfo = obj;
                                   this.setState({
                                       imageZoomInfo: this._imageZoomInfo
                                   })
                               }}
                               maxScale={3}>
                        <Image
                            style={[s(this.props).image, {height: this.state.viewHeight}, {opacity: this.props.bgImageOpacity}]}
                            resizeMode="contain"
                            source={{uri: this.state.image}}
                        />
                    </ImageZoom>
                    <Svg
                        height={this.state.viewHeight}
                        width={screenWidth}
                        style={{position: 'absolute', left: 0, top: 0}}
                        {...this.state.imageZoomPanResponder.panHandlers}
                    >
                        <AnimatedPolygon
                            ref={(ref) => this.polygon = ref}
                            stroke={this.props.overlayStrokeColor}
                            strokeWidth={this.props.overlayStrokeWidth}
                            strokeDasharray={this.props.strokeDasharray}
                            strokeDashoffset={this.props.strokeDashoffset}
                            points={this.state.overlayPositions}
                            x={this.state.polygonPosition.x}
                            y={this.state.polygonPosition.y}
                        />
                    </Svg>
                    <Animated.View renderToHardwareTextureAndroid
                                   style={[
                                       this.state.topLeft.getLayout(),
                                       {position: "absolute", backgroundColor: "transparent"},
                                       {width: this.state.topRight.x._value - this.state.topLeft.x._value},
                                       {height: this.state.bottomRight.y._value - this.state.topRight.y._value},
                                       {top: this.state.topLeft.y._value + this.state.polygonPosition.y},
                                       {left: this.state.topLeft.x._value + this.state.polygonPosition.x},
                                       {overflow: 'hidden'},
                                   ]}
                                   {...this._polygonPanResponder.panHandlers}>
                        <Animated.Image
                            style={[
                                s(this.props).image,
                                {position: 'absolute', overflow: 'hidden'},
                                {height: this.state.viewHeight},
                                {opacity: 1},
                                {top: -(this.state.topLeft.y._value + this.state.polygonPosition.y)},
                                {left: -(this.state.topLeft.x._value + this.state.polygonPosition.x)},
                                {
                                    transform: [
                                        {
                                            scale: this.state.imageZoomInfo.scale
                                        },
                                        {
                                            translateX: this.state.imageZoomInfo.positionX
                                        },
                                        {
                                            translateY: this.state.imageZoomInfo.positionY
                                        }
                                    ]
                                }
                            ]}
                            resizeMode="cover"
                            source={{uri: this.state.image}}
                        />
                    </Animated.View>

                    {this.props.enableCornerStrict && !this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderTopLeft.panHandlers}
                        style={[this.state.topLeft.getLayout(), s(this.props).handler]}>
                        <View style={[s(this.props).handlerI, {left: -10, top: -10}]}/>
                        <View style={[s(this.props).handlerRound, {left: 31, top: 31}]}/>
                    </Animated.View>
                    }
                    {this.props.enableCornerStrict && !this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderTopRight.panHandlers}
                        style={[this.state.topRight.getLayout(), s(this.props).handler]}>
                        <View style={[s(this.props).handlerI, {left: 10, top: -10}]}/>
                        <View style={[s(this.props).handlerRound, {right: 31, top: 31}]}/>
                    </Animated.View>
                    }
                    {this.props.enableCornerStrict && !this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderBottomLeft.panHandlers}
                        style={[this.state.bottomLeft.getLayout(), s(this.props).handler]}>
                        <View style={[s(this.props).handlerI, {left: -10, top: 10}]}/>
                        <View style={[s(this.props).handlerRound, {left: 31, bottom: 31}]}/>
                    </Animated.View>
                    }
                    {this.props.enableCornerStrict && !this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderBottomRight.panHandlers}
                        style={[this.state.bottomRight.getLayout(), s(this.props).handler]}>
                        <View style={[s(this.props).handlerI, {left: 10, top: 10}]}/>
                        <View style={[s(this.props).handlerRound, {right: 31, bottom: 31}]}/>
                    </Animated.View>
                    }


                    {!this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderMiddleLeft.panHandlers}
                        hitSlop={{top: 20, left: 30, bottom: 20, right: 30}}
                        style={[this.state.middleLeft.getLayout(), s(this.props).handlerVertical]}>
                        <View style={[s(this.props).handlerRectVertical]}/>
                    </Animated.View>
                    }
                    {!this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderMiddleRight.panHandlers}
                        hitSlop={{top: 20, left: 30, bottom: 20, right: 30}}
                        style={[this.state.middleRight.getLayout(), s(this.props).handlerVertical]}>
                        <View style={[s(this.props).handlerRectVertical]}/>
                    </Animated.View>
                    }
                    {!this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderMiddleTop.panHandlers}
                        hitSlop={{top: 30, left: 20, bottom: 30, right: 20}}
                        style={[this.state.middleTop.getLayout(), s(this.props).handlerHorizontal]}>
                        <View style={[s(this.props).handlerRectHorizontal]}/>
                    </Animated.View>
                    }
                    {!this.state.hideStrict &&
                    <Animated.View
                        {...this.panResponderMiddleBottom.panHandlers}
                        hitSlop={{top: 30, left: 20, bottom: 30, right: 20}}
                        style={[this.state.middleBottom.getLayout(), s(this.props).handlerHorizontal]}>
                        <View style={[s(this.props).handlerRectHorizontal]}/>
                    </Animated.View>
                    }
                </View>
            </View>
        );
    }


}


const s = (props) => {
    return {
        handlerI: {
            borderRadius: 0,
            height: 20,
            width: 20,
            backgroundColor: props.handlerColor,
        },
        handlerRound: {
            width: 39,
            position: 'absolute',
            height: 39,
            borderRadius: 100,
            backgroundColor: props.handlerColor,
        },
        handlerHorizontal: {
            width: props.handlerHorizontalWidth,
            height: props.handlerHorizontalHeight,
            overflow: 'visible',
            position: 'absolute',
            marginTop: -(props.handlerHorizontalHeight / 2),
            marginLeft: -(props.handlerHorizontalWidth / 2),
        },
        handlerVertical: {
            width: props.handlerHorizontalHeight,
            height: props.handlerHorizontalWidth,
            overflow: 'visible',
            position: 'absolute',
            marginTop: -(props.handlerHorizontalWidth / 2),
            marginLeft: -(props.handlerHorizontalHeight / 2),
        },
        handlerRectHorizontal: {
            position: 'absolute',
            width: props.handlerHorizontalWidth,
            height: props.handlerHorizontalHeight,
            backgroundColor: props.handlerColor,
        },
        handlerRectVertical: {
            position: 'absolute',
            width: props.handlerHorizontalHeight,
            height: props.handlerHorizontalWidth,
            backgroundColor: props.handlerColor,
        },
        image: {
            width: screenWidth,
            position: 'absolute',
        },
        handler: {
            height: 0,
            width: 0,
            overflow: 'visible',
            position: 'absolute',
        },
        cropContainer: {
            position: 'absolute',
            left: 0,
            width: screenWidth,
            top: 0,
        }
    };
};

export default CustomCrop;
